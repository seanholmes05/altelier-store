import type { Metadata } from "next";
import { Suspense } from "react";
import { CartContents } from "@/components/cart/cart-contents";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Bag | Altelier",
  robots: { index: false },
};

// The heading prerenders; the contents read the cart cookie and live prices, so they stream in.
// `#bag-status` is a persistent live region the line controls write to, and `#bag-heading`
// receives focus after a removal so keyboard and screen-reader users don't lose their place.
export default function CartPage({ searchParams }: PageProps<"/cart">) {
  return (
    <main id="main">
      <Section>
        <Container>
          <h1 id="bag-heading" tabIndex={-1} className="type-statement outline-none">
            Bag
          </h1>
          <p id="bag-status" role="status" aria-live="polite" className="sr-only" />
          <Suspense fallback={<BagSkeleton />}>
            <CheckoutNotice searchParams={searchParams} />
            <CartContents />
          </Suspense>
        </Container>
      </Section>
    </main>
  );
}

/** Shown after backing out of Stripe: the hold is released and the bag is exactly as it was. */
async function CheckoutNotice({ searchParams }: Pick<PageProps<"/cart">, "searchParams">) {
  if ((await searchParams).checkout !== "canceled") return null;
  return (
    <p role="status" className="type-caption mt-6 border-l border-ink pl-3">
      Checkout was canceled. Your bag is unchanged.
    </p>
  );
}

/** Keeps the layout stable while the bag loads. */
function BagSkeleton() {
  return (
    <div aria-busy="true" className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <div className="border-t border-line">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-line py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6"
          >
            <div className="aspect-[3/4] bg-wash" />
            <div className="space-y-3">
              <div className="h-5 w-2/3 bg-wash" />
              <div className="h-4 w-16 bg-wash" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading your bag…</span>
    </div>
  );
}
