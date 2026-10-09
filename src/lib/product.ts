// Pure product helpers and types. Keep free of `@/db` imports so components can use them.

export type Img = { src: string; alt: string };

export type Product = {
  /** URL slug, also used as the identifier. */
  id: string;
  name: string;
  /** Price in USD cents. */
  priceCents: number;
  category: string;
  /** Units on hand. 0 means out of stock. */
  stock: number;
  description: string;
  details: string[];
  /** Ordered gallery; `images[0]` is the primary image. Listings carry only the primary. */
  images: [Img, ...Img[]];
};

export const productHref = (p: Pick<Product, "id">) => `/products/${p.id}`;

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPrice = (cents: number) => priceFormat.format(cents / 100);

export type StockState = "in-stock" | "low-stock" | "out-of-stock";

const LOW_STOCK_THRESHOLD = 5;

export function getStock(p: Pick<Product, "stock">): { state: StockState; label: string } {
  if (p.stock <= 0) return { state: "out-of-stock", label: "Out of stock" };
  if (p.stock <= LOW_STOCK_THRESHOLD) {
    return { state: "low-stock", label: `Only ${p.stock} left` };
  }
  return { state: "in-stock", label: "In stock" };
}
