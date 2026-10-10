import type Stripe from "stripe";
import {
  claimStripeEvent,
  failStripeEvent,
  finishStripeEvent,
  listStalePendingOrders,
  markOrderPaid,
  markOrderRefunded,
  releaseOrder,
} from "@/db/queries/orders";
import type { PaidOutcome } from "@/db/queries/orders";
import { isUuid } from "@/lib/checkout";

// Pure orchestration over the order queries: no `server-only`, no Next imports, and every
// Stripe/Next side effect is injected, so the whole state machine can be exercised against a
// real database without Stripe credentials.

export type StripeDeps = {
  retrieveSession(id: string): Promise<Stripe.Checkout.Session>;
  expireSession(id: string): Promise<void>;
  refundPaymentIntent(paymentIntentId: string, orderId: string): Promise<void>;
  /** Stock changed: bust the cached storefront reads. */
  invalidateProducts(): void;
};

export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
] as const;

export type SessionOutcome = PaidOutcome | "awaiting_payment" | "no_order";

const paymentIntentId = (s: Stripe.Checkout.Session) =>
  typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null);

/**
 * Applies the CURRENT state of a Checkout Session to its order. Money moves only here, and only
 * when Stripe reports `paid`; the amount and session are then checked against our own order.
 */
export async function applySession(
  session: Stripe.Checkout.Session,
  deps: StripeDeps,
): Promise<SessionOutcome> {
  const orderId = session.client_reference_id;
  if (!isUuid(orderId)) return "no_order";

  // `unpaid` on a completed session means an asynchronous method is still settling. The
  // order stays pending until async_payment_succeeded or _failed.
  if (session.payment_status === "unpaid") return "awaiting_payment";
  if (session.amount_total == null || !session.currency) return "not_payable";

  const outcome = await markOrderPaid({
    orderId,
    sessionId: session.id,
    paymentIntentId: paymentIntentId(session),
    amountTotal: session.amount_total,
    currency: session.currency,
    email: session.customer_details?.email ?? null,
    shippingAddress: session.collected_information?.shipping_details ?? null,
  });

  if (outcome === "late_reserved") deps.invalidateProducts();

  if (outcome === "unfulfillable") {
    // Paid for something we can no longer supply: give the money back.
    const pi = paymentIntentId(session);
    if (pi) {
      await deps.refundPaymentIntent(pi, orderId);
      await markOrderRefunded(orderId);
    }
  }
  return outcome;
}

async function release(
  session: Stripe.Checkout.Session,
  to: "expired" | "payment_failed",
  deps: StripeDeps,
) {
  const orderId = session.client_reference_id;
  if (!isUuid(orderId)) return;
  if (await releaseOrder(orderId, to)) deps.invalidateProducts();
}

export type EventResult = "processed" | "duplicate" | "ignored";

/**
 * Processes one verified Stripe event exactly once in effect. Duplicate deliveries are caught
 * by the event ledger; and even two DIFFERENT events for the same session (completed plus
 * async_payment_succeeded) are safe, because every transition is guarded by order status.
 * Throws on failure so the route returns 5xx and Stripe retries.
 */
export async function handleStripeEvent(event: Stripe.Event, deps: StripeDeps): Promise<EventResult> {
  if (!(HANDLED_EVENTS as readonly string[]).includes(event.type)) return "ignored";
  if (!(await claimStripeEvent(event.id, event.type))) return "duplicate";

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        // Event payloads can be stale or out of order: act on the session as it is now.
        await applySession(await deps.retrieveSession(session.id), deps);
        break;
      }
      case "checkout.session.async_payment_failed":
        await release(session, "payment_failed", deps);
        break;
      case "checkout.session.expired":
        await release(session, "expired", deps);
        break;
    }
    await finishStripeEvent(event.id);
    return "processed";
  } catch (e) {
    await failStripeEvent(event.id, e instanceof Error ? e.message : String(e));
    throw e;
  }
}

/**
 * Expires an open session (so it can no longer be paid) and releases its order. If the session
 * turns out to be complete, it is applied instead, so a payment is never discarded.
 */
export async function cancelPendingOrder(
  orderId: string,
  sessionId: string | null,
  to: "canceled" | "expired",
  deps: StripeDeps,
): Promise<"released" | "paid" | "unchanged"> {
  if (sessionId) {
    try {
      await deps.expireSession(sessionId);
    } catch {
      // Already expired or already complete. Look at where it actually is.
      const current = await deps.retrieveSession(sessionId);
      if (current.status === "complete") {
        const outcome = await applySession(current, deps);
        return outcome === "paid" || outcome === "already_paid" ? "paid" : "unchanged";
      }
    }
  }
  const released = await releaseOrder(orderId, to);
  if (released) deps.invalidateProducts();
  return released ? "released" : "unchanged";
}

/**
 * Backstop for lost webhooks and crashed requests. Never releases on our own clock alone: it
 * asks Stripe where each stale session actually is first.
 */
export async function sweepStaleOrders(deps: StripeDeps) {
  const stale = await listStalePendingOrders();
  const summary = { checked: stale.length, paid: 0, released: 0, left: 0, failed: 0 };

  for (const { id, sessionId } of stale) {
    try {
      if (!sessionId) {
        // Never got a session. It cannot have been paid through us.
        const released = await releaseOrder(id, "expired");
        if (released) deps.invalidateProducts();
        summary[released ? "released" : "left"]++;
        continue;
      }
      const session = await deps.retrieveSession(sessionId);
      if (session.status === "complete") {
        const outcome = await applySession(session, deps);
        summary[outcome === "paid" || outcome === "already_paid" ? "paid" : "left"]++;
      } else {
        const result = await cancelPendingOrder(id, sessionId, "expired", deps);
        summary[result === "released" ? "released" : result === "paid" ? "paid" : "left"]++;
      }
    } catch (e) {
      console.error("sweep failed for order", id, e);
      summary.failed++;
    }
  }
  return summary;
}
