import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";

export type LiveProduct = {
  slug: string;
  name: string;
  /** Price in USD cents, straight from the database. */
  priceCents: number;
  /** Units on hand right now. */
  stock: number;
  imageUrl: string;
  imageAlt: string;
};

/**
 * Current price and stock for these products, keyed by slug. Deliberately NOT `'use cache'`:
 * the storefront queries tolerate minutes of staleness, but the cart must never price or
 * stock-check against an old value. Like the storefront, a product without a position-0
 * image is treated as not listed.
 */
export async function getLiveProducts(slugs: string[]): Promise<Map<string, LiveProduct>> {
  if (slugs.length === 0) return new Map();

  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      priceCents: products.priceCents,
      stock: products.stock,
      imageUrl: productImages.url,
      imageAlt: productImages.alt,
    })
    .from(products)
    .innerJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.position, 0)),
    )
    .where(inArray(products.slug, slugs));

  return new Map(rows.map((r) => [r.slug, r]));
}
