import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToBag } from "@/components/product/add-to-bag";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductCard } from "@/components/product/product-card";
import { StockStatus } from "@/components/product/stock-status";
import { Container, MediaFrame, ProductGrid, Section } from "@/components/ui";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/db/queries/products";
import { formatPrice, getStock } from "@/lib/product";

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return { title: `${product.name} | Altelier`, description: product.description };
}

type Params = Promise<{ slug: string }>;

/** Placeholder shown while the route params resolve, keeping the page layout stable. */
function ProductSkeleton() {
  return (
    <main id="main" aria-busy="true">
      <div className="grid md:grid-cols-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <MediaFrame ratio="portrait" className="md:aspect-[4/5]" />
        <div className="space-y-4 px-gutter py-8 md:px-8 md:py-12 lg:px-12">
          <div className="h-4 w-24 bg-wash" />
          <div className="h-12 w-3/4 bg-wash" />
          <div className="h-6 w-20 bg-wash" />
        </div>
      </div>
    </main>
  );
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}

async function ProductView({ params }: { params: Params }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const soldOut = getStock(product).state === "out-of-stock";
  const related = await getRelatedProducts(product.id, product.categoryId);

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
            <li>
              <Link href={`/collections/${product.categorySlug}`} className="link-quiet">
                {product.category}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </Container>

      <div className="grid md:grid-cols-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Gallery: swipeable slides at full quality, with thumbnails */}
        <ProductGallery images={product.images} name={product.name} soldOut={soldOut} />

        {/* Information */}
        <div className="px-gutter py-8 md:px-8 md:py-12 lg:px-12">
          <div className="md:sticky md:top-24">
            <p className="type-label text-muted">{product.category}</p>
            <h1 className="type-statement mt-2">{product.name}</h1>
            <p className="type-title mt-4">{formatPrice(product.priceCents)}</p>
            <div className="mt-3">
              <StockStatus product={product} />
            </div>

            <p className="type-body mt-8">{product.description}</p>

            <div className="mt-8">
              <AddToBag slug={product.id} soldOut={soldOut} />
            </div>

            <div className="mt-10 border-t border-line">
              <details className="group border-b border-line" open>
                <summary className="type-label flex cursor-pointer list-none items-center justify-between py-4">
                  Details
                  <span aria-hidden className="group-open:hidden">+</span>
                  <span aria-hidden className="hidden group-open:inline">&minus;</span>
                </summary>
                <ul className="type-body space-y-1 pb-4">
                  {product.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </details>
              <details className="group border-b border-line">
                <summary className="type-label flex cursor-pointer list-none items-center justify-between py-4">
                  Shipping &amp; Returns
                  <span aria-hidden className="group-open:hidden">+</span>
                  <span aria-hidden className="hidden group-open:inline">&minus;</span>
                </summary>
                <p className="type-body pb-4">
                  Complimentary shipping on every order. Returns and exchanges accepted within
                  thirty days.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      <Section flush className="pt-section">
        <Container className="pb-6">
          <h2 className="type-heading">You May Also Like</h2>
        </Container>
        <ProductGrid>
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </ProductGrid>
      </Section>
    </main>
  );
}
