import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PendingPoller } from "@/components/checkout/pending-poller";
import { Button, Container, Section } from "@/components/ui";
import { getOrderBySessionId } from "@/db/queries/orders";
import { SESSION_ID } from "@/lib/checkout-reconcile";

export const metadata: Metadata = {
  title: "Order | Altelier",
  robots: { index: false },
};

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <main id="main">
      <Section>
        <Container>
          <Suspense fallback={<OrderSkeleton />}>
            <OrderState searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
    </main>
  );
}

type Order = NonNullable<Awaited<ReturnType<typeof getOrderBySessionId>>>;

// A pure read of OUR order. The session id is only a lookup key (unguessable); nothing on this
// page changes state or trusts the URL for payment status. Confirmation comes from the webhook
// (or the server-side reconcile in /checkout/return and the status route), never from here.
async function OrderState({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" ? raw : "";
  if (!SESSION_ID.test(sessionId)) notFound();

  const order = await getOrderBySessionId(sessionId);
  if (!order) notFound();

  switch (order.status) {
    case "paid":
      return <Confirmed order={order} />;
    case "pending_payment":
      return <Pending order={order} sessionId={sessionId} />;
    case "refunded":
      return (
        <Notice
          title="Order refunded"
          body="A piece sold out while your payment was completing, so we've refunded it in full. It can take a few days to appear on your statement."
          order={order}
        />
      );
    case "needs_review":
      return (
        <Notice
          title="We're reviewing your order"
          body={`Something about this payment needs a closer look. We'll be in touch about order #${order.number}.`}
          order={order}
        />
      );
    case "canceled":
      return (
        <Failure
          title="Checkout canceled"
          body="You canceled before paying, so you haven't been charged. Your bag is unchanged."
        />
      );
    case "expired":
      return (
        <Failure
          title="Checkout expired"
          body="Your session timed out before payment was completed, so you haven't been charged. We've released the pieces we were holding."
        />
      );
    case "payment_failed":
    default:
      return (
        <Failure
          title="Payment not completed"
          body="Your payment didn't go through, so you haven't been charged. Your bag is unchanged. You can try again or use a different payment method."
        />
      );
  }
}

function Confirmed({ order }: { order: Order }) {
  const address = readAddress(order.shippingAddress);
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <div>
        <p className="type-label flex items-center gap-2">
          <span aria-hidden className="inline-block size-2 bg-ink" />
          Confirmed
        </p>
        <h1 className="type-statement mt-3">Thank you for your order</h1>
        <p className="type-body mt-3 text-muted">
          Order #{order.number}
          {order.email ? ` · ${order.email}` : ""}
        </p>

        <h2 className="type-heading mt-10">Items</h2>
        <div className="mt-4">
          <Summary order={order} />
        </div>
      </div>

      <aside className="mt-10 lg:mt-0 lg:self-start" aria-label="Delivery">
        <h2 className="type-heading">Delivery</h2>
        {address.length > 0 ? (
          <address className="type-body mt-3 not-italic">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        ) : (
          <p className="type-body mt-3 text-muted">Complimentary shipping on every order.</p>
        )}
        <Button href="/new-arrivals" className="mt-8 w-full">
          Continue shopping
        </Button>
      </aside>
    </div>
  );
}

function Pending({ order, sessionId }: { order: Order; sessionId: string }) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <div>
        <p className="type-label flex items-center gap-2 text-muted">
          <span aria-hidden className="inline-block size-2 animate-pulse bg-ink" />
          Pending
        </p>
        <h1 className="type-statement mt-3">Confirming your payment</h1>
        <p className="type-body mt-3 text-muted">
          We&apos;re waiting for confirmation from the payment provider. This usually takes a few
          seconds. Please keep this page open and don&apos;t pay again.
        </p>
        <PendingPoller sessionId={sessionId} />
      </div>

      <section className="mt-10 lg:mt-0" aria-label="Your order">
        <h2 className="type-heading">Your order</h2>
        <div className="mt-4">
          <Summary order={order} />
        </div>
      </section>
    </div>
  );
}

function Failure({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-prose">
      <h1 className="type-statement">{title}</h1>
      <p className="type-body mt-3 text-muted">{body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/checkout">Try again</Button>
        <Button href="/cart" variant="secondary">
          Return to bag
        </Button>
      </div>
    </div>
  );
}

function Notice({ title, body, order }: { title: string; body: string; order: Order }) {
  return (
    <div className="max-w-prose">
      <h1 className="type-statement">{title}</h1>
      <p className="type-body mt-3 text-muted">{body}</p>
      <div className="mt-8">
        <Summary order={order} />
      </div>
      <Button href="/new-arrivals" className="mt-8">
        Continue shopping
      </Button>
    </div>
  );
}

function Summary({ order }: { order: Order }) {
  return (
    <OrderSummary
      items={order.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        lineTotalCents: i.lineTotalCents,
        imageUrl: i.imageUrl,
        imageAlt: i.imageAlt,
      }))}
      subtotalCents={order.subtotalCents}
      shippingCents={order.shippingCents}
      taxCents={order.taxCents}
      totalCents={order.totalCents}
    />
  );
}

/** The stored Stripe shipping details, defensively narrowed into display lines. */
function readAddress(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const v = value as { name?: unknown; address?: Record<string, unknown> | null };
  const a = v.address ?? {};
  const text = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim() : null);

  const cityLine = [text(a.city), text(a.state), text(a.postal_code)].filter(Boolean).join(", ");
  return [text(v.name), text(a.line1), text(a.line2), cityLine || null, text(a.country)].filter(
    (l): l is string => Boolean(l),
  );
}

function OrderSkeleton() {
  return (
    <div aria-busy="true">
      <div className="h-4 w-24 bg-wash" />
      <div className="mt-4 h-10 w-2/3 bg-wash" />
      <div className="mt-4 h-5 w-1/3 bg-wash" />
      <span className="sr-only">Loading your order…</span>
    </div>
  );
}
