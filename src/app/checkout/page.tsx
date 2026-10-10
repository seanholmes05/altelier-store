import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Container, Section } from "@/components/ui";
import { getCart } from "@/lib/cart-server";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/checkout";

export const metadata: Metadata = {
  title: "Checkout | Altelier",
  robots: { index: false },
};

// The heading prerenders; the summary reads the bag cookie and live prices/stock, so it streams.
export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <main id="main">
      <Section>
        <Container>
          <h1 className="type-statement">Checkout</h1>
          <Suspense fallback={<ReviewSkeleton />}>
            <Review searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
    </main>
  );
}

async function Review({ searchParams }: Pick<PageProps<"/checkout">, "searchParams">) {
  const [cart, params] = await Promise.all([getCart(), searchParams]);
  if (cart.lines.length === 0) redirect("/cart");

  const canceled = params.status === "canceled";
  const changed =
    cart.unavailable.length > 0 || cart.lines.some((l) => l.requestedQuantity > l.quantity);

  return (
    <div className="mt-8">
      {canceled ? (
        <p role="status" className="type-caption mb-6 border-l border-ink pl-3">
          Payment was canceled and you haven&apos;t been charged. Your bag is unchanged.
        </p>
      ) : null}
      {changed ? (
        <p role="status" className="type-caption mb-6 border-l border-danger pl-3 text-danger">
          Availability changed since you added these pieces, so your quantities and total have
          been updated.{" "}
          <Link href="/cart" className="link">
            Review your bag
          </Link>
        </p>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <section aria-labelledby="order-summary">
          <div className="flex items-baseline justify-between">
            <h2 id="order-summary" className="type-heading">
              Order summary
            </h2>
            <Link href="/cart" className="type-caption link">
              Edit bag
            </Link>
          </div>
          <div className="mt-4">
            <OrderSummary
              items={cart.lines.map((l) => ({
                id: l.slug,
                name: l.name,
                quantity: l.quantity,
                unitPriceCents: l.priceCents,
                lineTotalCents: l.lineTotalCents,
                imageUrl: l.image.src,
                imageAlt: l.image.alt,
                href: l.href,
              }))}
              subtotalCents={cart.subtotalCents}
              totalCents={cart.subtotalCents}
            />
          </div>
        </section>

        <aside aria-labelledby="payment" className="mt-10 lg:mt-0 lg:self-start">
          <h2 id="payment" className="type-heading">
            Payment
          </h2>
          <p className="type-caption mt-3 text-muted">
            You&apos;ll enter your shipping address and pay securely with Stripe. We hold your
            pieces for {CHECKOUT_HOLD_MINUTES} minutes once you continue.
          </p>
          <div className="mt-6">
            <CheckoutButton />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Keeps the layout stable while the summary loads. */
function ReviewSkeleton() {
  return (
    <div aria-busy="true" className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <div className="border-t border-line">
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-b border-line py-4">
            <div className="aspect-[3/4] bg-wash" />
            <div className="space-y-3">
              <div className="h-5 w-2/3 bg-wash" />
              <div className="h-4 w-1/3 bg-wash" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading your order summary…</span>
    </div>
  );
}
