import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { Container, ProductGrid, Section } from "@/components/ui";
import { getNewArrivals } from "@/db/queries/products";

export const metadata: Metadata = {
  title: "New Arrivals | Altelier",
  description: "The latest pieces to arrive at Altelier, newest first.",
};

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(48);

  return (
    <main id="main">
      <Container className="py-4">
        <nav aria-label="Breadcrumb">
          <ol className="type-caption flex flex-wrap gap-x-2 text-muted">
            <li>
              <Link href="/" className="link-quiet">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              New Arrivals
            </li>
          </ol>
        </nav>
      </Container>

      <Section flush>
        <Container className="pb-6 pt-4">
          <h1 className="type-statement">New Arrivals</h1>
          <p className="type-caption mt-3 text-muted">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        </Container>

        {products.length > 0 ? (
          <ProductGrid>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </ProductGrid>
        ) : (
          <Container className="py-section">
            <p className="type-body text-muted">New pieces are on their way. Please check back soon.</p>
          </Container>
        )}
      </Section>
    </main>
  );
}
