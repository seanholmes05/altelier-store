// Pure cart rules and cookie format: no `@/db` or `next/headers` import, so client components
// and plain scripts can use it.
//
// The cart cookie stores only which products and how many (`slug:qty,slug:qty`). It never
// carries a price, name or stock level: those are looked up live on every read and mutation,
// so nothing the client sends can change what a product costs.

export const CART_COOKIE = "altelier_cart";
export const CART_MAX_LINES = 20;
/** Upper bound per line; the effective limit is also capped by live stock. */
export const CART_MAX_QUANTITY = 10;
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type CartEntry = { slug: string; quantity: number };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 100 && SLUG.test(value);
}

/** The most of a product that may be in the cart, given its live stock. */
export function maxQuantityFor(stock: number): number {
  return Math.max(0, Math.min(Math.trunc(stock), CART_MAX_QUANTITY));
}

/**
 * Parses the cookie value. Anything malformed is dropped rather than trusted: bad slugs,
 * non-integer or out-of-range quantities, duplicates (first wins), and lines beyond the cap.
 */
export function parseCart(raw: string | null | undefined): CartEntry[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const entries: CartEntry[] = [];

  for (const part of raw.split(",")) {
    const [slug, qty, ...rest] = part.split(":");
    if (rest.length > 0 || !isValidSlug(slug) || seen.has(slug)) continue;
    if (!/^\d{1,3}$/.test(qty ?? "")) continue;
    const quantity = Math.min(Number(qty), CART_MAX_QUANTITY);
    if (quantity < 1) continue;
    seen.add(slug);
    entries.push({ slug, quantity });
    if (entries.length >= CART_MAX_LINES) break;
  }
  return entries;
}

export function serializeCart(entries: CartEntry[]): string {
  return entries.map((e) => `${e.slug}:${e.quantity}`).join(",");
}

export function itemCount(entries: Pick<CartEntry, "quantity">[]): number {
  return entries.reduce((sum, e) => sum + e.quantity, 0);
}

/** Integer cents in, integer cents out. */
export function subtotalCents(lines: { priceCents: number; quantity: number }[]): number {
  return lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
}
