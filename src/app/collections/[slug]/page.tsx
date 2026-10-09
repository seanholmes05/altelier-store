import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Container, ProductGrid, Section } from "@/components/ui";
import {
  getCategoryBySlug,
  getCategorySlugs,
  getProductsByCategory,
} from "@/db/queries/products";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getCategorySlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return {};
  return {
    title: `${category.name} | Altelier`,
    description: `Shop ${category.name.toLowerCase()} at Altelier, newest first.`,
  };
}

/** Placeholder shown while the route params resolve, keeping the page layout stable. */
function CollectionSkeleton() {
  return (
    <main id="main" aria-busy="true">
      <Container className="space-y-4 py-8">
        <div className="h-4 w-32 bg-wash" />
        <div className="h-12 w-1/2 bg-wash" />
      </Container>
    </main>
  );
}

export default function CollectionPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <CollectionView params={params} />
    </Suspense>
  );
}

async function CollectionView({ params }: { params: Params }) {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.slug);

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
              {category.name}
            </li>
          </ol>
        </nav>
      </Container>

      <Section flush>
        <Container className="pb-6 pt-4">
          <h1 className="type-statement">{category.name}</h1>
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
            <p className="type-body text-muted">
              New {category.name.toLowerCase()} pieces are on their way. Please check back soon.
            </p>
          </Container>
        )}
      </Section>
    </main>
  );
}
