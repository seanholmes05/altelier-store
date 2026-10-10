import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, productImages, products } from "@/db/schema";
import type { OrderStatus } from "@/db/schema";

// Everything here is uncached and server-only. Stock and order state must be read and written
// live, and every state change is a single guarded statement so concurrent webhooks, the
// sweeper and the cancel route can never double-apply it.

export type ReservationLine = {
  productId: number;
  slug: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type ReserveResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: "insufficient_stock" };

const errorText = (e: unknown): string => {
  const parts: string[] = [];
  let cur: unknown = e;
  for (let i = 0; i < 4 && cur; i++) {
    parts.push(String((cur as { message?: unknown }).message ?? cur));
    cur = (cur as { cause?: unknown }).cause;
  }
  return parts.join(" ");
};

/** True when the failure is the products stock >= 0 CHECK firing, i.e. an oversell attempt. */
export const isStockViolation = (e: unknown) => /products_stock_non_negative/.test(errorText(e));

/**
 * Creates a `pending_payment` order and takes its stock in ONE transaction (a Neon HTTP
 * batch). The decrements are unguarded on purpose: if any line would oversell, the products
 * `stock >= 0` CHECK aborts the whole batch and nothing is reserved.
 */
export async function createReservedOrder(input: {
  userId: string | null;
  lines: ReservationLine[];
  cartHash: string;
  reservedUntil: Date;
  currency?: string;
}): Promise<ReserveResult> {
  const orderId = randomUUID();
  const subtotal = input.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const now = new Date();

  const statements = [
    ...input.lines.map((l) =>
      db
        .update(products)
        .set({ stock: sql`${products.stock} - ${l.quantity}`, updatedAt: now })
        .where(eq(products.id, l.productId)),
    ),
    db.insert(orders).values({
      id: orderId,
      userId: input.userId,
      status: "pending_payment",
      currency: input.currency ?? "usd",
      subtotalCents: subtotal,
      shippingCents: 0,
      taxCents: 0,
      totalCents: subtotal,
      cartHash: input.cartHash,
      reservedUntil: input.reservedUntil,
    }),
    db.insert(orderItems).values(
      input.lines.map((l) => ({
        orderId,
        productId: l.productId,
        productSlug: l.slug,
        name: l.name,
        unitPriceCents: l.unitPriceCents,
        quantity: l.quantity,
        lineTotalCents: l.unitPriceCents * l.quantity,
      })),
    ),
  ];

  try {
    await db.batch(statements as unknown as Parameters<typeof db.batch>[0]);
    return { ok: true, orderId };
  } catch (e) {
    if (isStockViolation(e)) return { ok: false, reason: "insufficient_stock" };
    throw e;
  }
}

/**
 * Moves a `pending_payment` order to a released status and returns its stock, atomically.
 * Returns true only for the caller that won the transition, so stock is restored exactly once
 * no matter how many events, sweeps or cancels race.
 */
export async function releaseOrder(
  orderId: string,
  to: Extract<OrderStatus, "expired" | "canceled" | "payment_failed">,
): Promise<boolean> {
  const res = await db.execute(sql`
    with flipped as (
      update orders
         set status = ${to}, stock_released_at = now(), updated_at = now()
       where id = ${orderId} and status = 'pending_payment'
      returning id
    ), restored as (
      update products p
         set stock = p.stock + oi.quantity, updated_at = now()
        from order_items oi
        join flipped f on f.id = oi.order_id
       where p.id = oi.product_id
      returning p.id
    )
    select count(*)::int as n from flipped
  `);
  return Number((res.rows[0] as { n: number } | undefined)?.n ?? 0) === 1;
}

export type PaidOutcome =
  | "paid"
  | "already_paid"
  | "late_reserved"
  | "unfulfillable"
  | "mismatch"
  | "not_found"
  | "not_payable";

export type PaymentFacts = {
  orderId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amountTotal: number;
  currency: string;
  email: string | null;
  shippingAddress: unknown;
};

/**
 * Confirms a payment against what WE recorded: the session must be this order's session and
 * the amount and currency must equal the order total. Never trusts a client or a URL.
 * Idempotent: only a `pending_payment` order (or a released one that can be re-reserved)
 * transitions, so a replay returns `already_paid`.
 */
export async function markOrderPaid(f: PaymentFacts): Promise<PaidOutcome> {
  const currency = f.currency.toLowerCase();
  const address = f.shippingAddress == null ? null : JSON.stringify(f.shippingAddress);

  const direct = await db.execute(sql`
    update orders
       set status = 'paid', paid_at = now(), updated_at = now(),
           stripe_checkout_session_id = ${f.sessionId},
           stripe_payment_intent_id = ${f.paymentIntentId},
           email = ${f.email}, shipping_address = ${address}::jsonb
     where id = ${f.orderId}
       and status = 'pending_payment'
       and (stripe_checkout_session_id = ${f.sessionId} or stripe_checkout_session_id is null)
       and total_cents = ${f.amountTotal} and currency = ${currency}
    returning id
  `);
  if (direct.rows.length === 1) return "paid";

  const [order] = await db
    .select({
      status: orders.status,
      totalCents: orders.totalCents,
      currency: orders.currency,
      sessionId: orders.stripeCheckoutSessionId,
    })
    .from(orders)
    .where(eq(orders.id, f.orderId))
    .limit(1);

  if (!order) return "not_found";
  if (order.status === "paid" || order.status === "refunded") return "already_paid";
  if (order.sessionId && order.sessionId !== f.sessionId) return "mismatch";
  if (order.totalCents !== f.amountTotal || order.currency !== currency) {
    await db
      .update(orders)
      .set({ status: "needs_review", updatedAt: new Date() })
      .where(eq(orders.id, f.orderId));
    return "mismatch";
  }

  if (order.status === "expired" || order.status === "canceled" || order.status === "payment_failed") {
    // Paid after we released the stock. Re-take it and mark paid in one statement; if any
    // line has sold out meanwhile the stock CHECK aborts it and the caller refunds.
    try {
      const late = await db.execute(sql`
        with claimed as (
          update orders
             set status = 'paid', paid_at = now(), updated_at = now(), stock_released_at = null,
                 stripe_checkout_session_id = ${f.sessionId},
                 stripe_payment_intent_id = ${f.paymentIntentId},
                 email = ${f.email}, shipping_address = ${address}::jsonb
           where id = ${f.orderId}
             and status in ('expired', 'canceled', 'payment_failed')
             and total_cents = ${f.amountTotal} and currency = ${currency}
          returning id
        ), taken as (
          update products p
             set stock = p.stock - oi.quantity, updated_at = now()
            from order_items oi
            join claimed c on c.id = oi.order_id
           where p.id = oi.product_id
          returning p.id
        )
        select count(*)::int as n from claimed
      `);
      return Number((late.rows[0] as { n: number }).n) === 1 ? "late_reserved" : "already_paid";
    } catch (e) {
      if (!isStockViolation(e)) throw e;
      await db
        .update(orders)
        .set({
          status: "needs_review",
          stripePaymentIntentId: f.paymentIntentId,
          email: f.email,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, f.orderId));
      return "unfulfillable";
    }
  }
  return "not_payable";
}

/** After a refund of an unfulfillable payment. Guarded so it only applies to `needs_review`. */
export async function markOrderRefunded(orderId: string): Promise<void> {
  await db.execute(sql`
    update orders set status = 'refunded', updated_at = now()
     where id = ${orderId} and status = 'needs_review'
  `);
}

/** Records the Stripe session on an order created moments ago. */
export async function attachSession(orderId: string, sessionId: string): Promise<void> {
  await db.execute(sql`
    update orders set stripe_checkout_session_id = ${sessionId}, updated_at = now()
     where id = ${orderId} and stripe_checkout_session_id is null
  `);
}

export async function getOrderById(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return order;
}

export async function getOrderBySessionId(sessionId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
    .limit(1);
  if (!order) return undefined;
  const items = await db
    .select({
      id: orderItems.id,
      productSlug: orderItems.productSlug,
      name: orderItems.name,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
      lineTotalCents: orderItems.lineTotalCents,
      imageUrl: productImages.url,
      imageAlt: productImages.alt,
    })
    .from(orderItems)
    .leftJoin(
      productImages,
      and(eq(productImages.productId, orderItems.productId), eq(productImages.position, 0)),
    )
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.id));
  return { ...order, items };
}

/** Pending orders whose hold ended more than `graceSeconds` ago. */
export async function listStalePendingOrders(graceSeconds = 120, limit = 50) {
  const res = await db.execute(sql`
    select id, stripe_checkout_session_id as "sessionId"
      from orders
     where status = 'pending_payment'
       and reserved_until < now() - make_interval(secs => ${graceSeconds})
     order by reserved_until
     limit ${limit}
  `);
  return res.rows as { id: string; sessionId: string | null }[];
}

// --- Stripe event ledger -------------------------------------------------------------------

/**
 * Claims an event for processing. True for a first delivery, or a retry of one that failed (or
 * has been "processing" for over 5 minutes, i.e. a crashed worker). False means it was already
 * processed or is being processed: the caller should return 2xx and do nothing.
 */
export async function claimStripeEvent(id: string, type: string): Promise<boolean> {
  const res = await db.execute(sql`
    insert into stripe_events (id, type, status, attempts)
    values (${id}, ${type}, 'processing', 1)
    on conflict (id) do update
       set status = 'processing', attempts = stripe_events.attempts + 1,
           received_at = now(), error = null
     where stripe_events.status = 'failed'
        or (stripe_events.status = 'processing'
            and stripe_events.received_at < now() - interval '5 minutes')
    returning id
  `);
  return res.rows.length === 1;
}

export async function finishStripeEvent(id: string): Promise<void> {
  await db.execute(sql`
    update stripe_events set status = 'processed', processed_at = now(), error = null
     where id = ${id}
  `);
}

export async function failStripeEvent(id: string, message: string): Promise<void> {
  await db.execute(sql`
    update stripe_events set status = 'failed', error = ${message.slice(0, 500)} where id = ${id}
  `);
}
