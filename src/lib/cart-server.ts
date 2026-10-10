import "server-only";
import { cookies } from "next/headers";
import { getLiveProducts } from "@/db/queries/cart";
import {
  CART_COOKIE,
  itemCount,
  maxQuantityFor,
  parseCart,
  subtotalCents,
} from "@/lib/cart";
import type { CartEntry } from "@/lib/cart";
import type { Img } from "@/lib/product";

export type CartLine = {
  /** Internal product id, for reserving stock at checkout. Not for the client. */
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  /** Effective quantity: the stored quantity clamped to current stock. */
  quantity: number;
  /** What the cookie held, when stock has since dropped below it. */
  requestedQuantity: number;
  stock: number;
  maxQuantity: number;
  lineTotalCents: number;
  image: Img;
  href: string;
};

export type UnavailableLine = {
  slug: string;
  name: string;
  /** `out-of-stock`: still listed, none left. `removed`: no longer in the catalogue. */
  reason: "out-of-stock" | "removed";
  /** Present when the product is still listed. */
  image?: Img;
  href?: string;
};

export type CartView = {
  lines: CartLine[];
  /** In the cart, but no longer listed or out of stock. Excluded from the subtotal. */
  unavailable: UnavailableLine[];
  itemCount: number;
  subtotalCents: number;
};

/** Reads the cart cookie only (no database). Cheap enough for the header count. */
export async function readCartEntries(): Promise<CartEntry[]> {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

/**
 * The cart as the shopper should see it: every price and stock level comes from the
 * database now, never from the cookie. Reading cannot write the cookie, so a stale entry is
 * only displayed corrected; the next mutation persists the correction.
 */
export async function getCart(): Promise<CartView> {
  const entries = await readCartEntries();
  const live = await getLiveProducts(entries.map((e) => e.slug));

  const lines: CartLine[] = [];
  const unavailable: UnavailableLine[] = [];

  for (const { slug, quantity: requestedQuantity } of entries) {
    const product = live.get(slug);
    const maxQuantity = product ? maxQuantityFor(product.stock) : 0;
    if (!product || maxQuantity === 0) {
      unavailable.push(
        product
          ? {
              slug,
              name: product.name,
              reason: "out-of-stock",
              image: { src: product.imageUrl, alt: product.imageAlt },
              href: `/products/${slug}`,
            }
          : { slug, name: slug, reason: "removed" },
      );
      continue;
    }
    const quantity = Math.min(requestedQuantity, maxQuantity);
    lines.push({
      productId: product.id,
      slug,
      name: product.name,
      priceCents: product.priceCents,
      quantity,
      requestedQuantity,
      stock: product.stock,
      maxQuantity,
      lineTotalCents: product.priceCents * quantity,
      image: { src: product.imageUrl, alt: product.imageAlt },
      href: `/products/${slug}`,
    });
  }

  return {
    lines,
    unavailable,
    itemCount: itemCount(lines),
    subtotalCents: subtotalCents(lines),
  };
}
