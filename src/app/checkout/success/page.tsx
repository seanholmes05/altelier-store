import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button, Container, Section, TextLink } from "@/components/ui";
import { getOrderBySessionId } from "@/db/queries/orders";
import { formatPrice } from "@/lib/product";

export const metadata: Metadata = {
  title: "Order | Altelier",
  robots: { index: false },
};

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <main id="main">
      <Section>
        <Container prose>
          <Suspense fallback={<p className="type-caption text-muted">Loading your order…</p>}>
            <OrderStatus searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
    </main>
  );
}

// A pure read of OUR order. The session id is only a lookup key (unguessable); nothing on this
// page changes state or trusts the URL for payment status.
async function OrderStatus({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" ? raw : "";
  if (!/^cs_[A-Za-z0-9_]{10,}$/.test(sessionId)) notFound();

  const order = await getOrderBySessionId(sessionId);
  if (!order) notFound();

  if (order.status === "paid") {
    return (
      <>
        <h1 className="type-statement">Thank you</h1>
        <p className="type-body mt-4 text-muted">
          Order #{order.number} is confirmed
          {order.email ? ` for ${order.email}` : ""}.
        </p>
        <ul className="mt-8 border-t border-line">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 border-b border-line py-4"
            >
              <span className="type-body">
                {item.name}
                <span className="type-caption ml-2 text-muted">× {item.quantity}</span>
              </span>
              <span className="type-body">{formatPrice(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <p className="type-heading mt-4 flex justify-between">
          <span>Total</span>
          <span>{formatPrice(order.totalCents)}</span>
        </p>
        <Button href="/new-arrivals" className="mt-10">
          Continue shopping
        </Button>
      </>
    );
  }

  if (order.status === "pending_payment") {
    return (
      <>
        <h1 className="type-statement">Confirming your payment</h1>
        <p className="type-body mt-4 text-muted">
          We haven&apos;t received confirmation yet. This usually takes a few seconds.
        </p>
        <p className="type-body mt-6">
          <TextLink href={`/checkout/return?session_id=${encodeURIComponent(sessionId)}`}>
            Check again
          </TextLink>
        </p>
      </>
    );
  }

  if (order.status === "refunded") {
    return (
      <>
        <h1 className="type-statement">Order refunded</h1>
        <p className="type-body mt-4 text-muted">
          A piece sold out while your payment was completing, so we&apos;ve refunded it in full.
          It can take a few days to appear.
        </p>
        <Button href="/new-arrivals" className="mt-10">
          Continue shopping
        </Button>
      </>
    );
  }

  if (order.status === "needs_review") {
    return (
      <>
        <h1 className="type-statement">We&apos;re reviewing your order</h1>
        <p className="type-body mt-4 text-muted">
          Something about this payment needs a closer look. We&apos;ll be in touch about order #
          {order.number}.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="type-statement">Payment not completed</h1>
      <p className="type-body mt-4 text-muted">
        Your payment didn&apos;t go through, so you haven&apos;t been charged. Your bag is
        unchanged.
      </p>
      <Button href="/cart" className="mt-10">
        Return to bag
      </Button>
    </>
  );
}
