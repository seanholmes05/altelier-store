import type { Metadata } from "next";
import { Suspense } from "react";
import { CartContents } from "@/components/cart/cart-contents";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Bag | Altelier",
  robots: { index: false },
};

// The heading prerenders; the contents read the cart cookie and live prices, so they stream in.
export default function CartPage() {
  return (
    <main id="main">
      <Section>
        <Container>
          <h1 className="type-statement">Bag</h1>
          <Suspense fallback={<p className="type-caption mt-8 text-muted">Loading your bag…</p>}>
            <CartContents />
          </Suspense>
        </Container>
      </Section>
    </main>
  );
}
