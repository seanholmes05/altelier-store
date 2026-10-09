import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, productImages, products } from "@/db/schema";
import type { Img, Product } from "@/lib/product";

const columns = {
  id: products.slug,
  name: products.name,
  priceCents: products.priceCents,
  category: categories.name,
  categoryId: products.categoryId,
  stock: products.stock,
  description: products.description,
  details: products.details,
  imageUrl: productImages.url,
  imageAlt: productImages.alt,
};

type Row = {
  id: string;
  name: string;
  priceCents: number;
  category: string;
  categoryId: number;
  stock: number;
  description: string;
  details: string[];
  imageUrl: string;
  imageAlt: string;
};

/** Product plus the internal category id, which related-product lookups need. */
export type CatalogProduct = Product & { categoryId: number };

const toProduct = ({ imageUrl, imageAlt, ...rest }: Row): CatalogProduct => ({
  ...rest,
  images: [{ src: imageUrl, alt: imageAlt }],
});

/**
 * Listing query base. Joins each product's primary image (position 0), so a
 * product without an image is not listed. Lists carry only that primary image;
 * `getProductBySlug` loads the full gallery.
 */
const listing = () =>
  db
    .select(columns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.position, 0)),
    );

/** Newest products first. */
export async function getNewArrivals(limit = 8): Promise<CatalogProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await listing()
    .orderBy(desc(products.createdAt), asc(products.id))
    .limit(limit);
  return rows.map(toProduct);
}

/** The product with its full ordered image gallery, or `undefined`. */
export async function getProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const [row] = await listing().where(eq(products.slug, slug)).limit(1);
  if (!row) return undefined;

  const gallery = await db
    .select({ src: productImages.url, alt: productImages.alt })
    .from(productImages)
    .innerJoin(products, eq(productImages.productId, products.id))
    .where(eq(products.slug, slug))
    .orderBy(asc(productImages.position));

  const product = toProduct(row);
  return gallery.length > 0
    ? { ...product, images: gallery as [Img, ...Img[]] }
    : product;
}

/** Same-category products first, then the rest, newest first. */
export async function getRelatedProducts(
  productId: string,
  categoryId: number,
  limit = 4,
): Promise<CatalogProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await listing()
    .where(ne(products.slug, productId))
    .orderBy(sql`(${products.categoryId} = ${categoryId}) desc`, desc(products.createdAt))
    .limit(limit);
  return rows.map(toProduct);
}

export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((r) => r.slug);
}
