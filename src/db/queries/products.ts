import { asc, desc, eq, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Product } from "@/lib/product";

const columns = {
  id: products.slug,
  name: products.name,
  priceCents: products.priceCents,
  category: categories.name,
  categoryId: products.categoryId,
  stock: products.stock,
  description: products.description,
  details: products.details,
  imageUrl: products.imageUrl,
  imageAlt: products.imageAlt,
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
  image: { src: imageUrl, alt: imageAlt },
});

/** Newest products first. */
export async function getNewArrivals(limit = 8): Promise<CatalogProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db
    .select(columns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt), asc(products.id))
    .limit(limit);
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const [row] = await db
    .select(columns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  return row ? toProduct(row) : undefined;
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

  const rows = await db
    .select(columns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
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
