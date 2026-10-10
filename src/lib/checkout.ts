// Pure checkout constants and helpers: no `@/db`, `next/*` or Stripe import.
import { createHash } from "node:crypto";

/** How long stock is held, and Stripe's session expiry. 30 minutes is Stripe's minimum. */
export const CHECKOUT_HOLD_MINUTES = 30;

/** Countries Checkout will collect a shipping address for. Change here; nothing else assumes US. */
export const SHIPPING_COUNTRIES = ["US"] as const;

/** HttpOnly cookie holding this browser's pending order id (never trusted for authorization). */
export const CHECKOUT_COOKIE = "altelier_checkout";

/** Label for sessions created by this integration, with Stripe's recommended random suffix. */
export const CHECKOUT_INTEGRATION_IDENTIFIER = "altelier-hosted-checkout-qwhzmvrd";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

/**
 * Fingerprint of what is being bought and at what price. Two checkouts with the same hash can
 * share a Stripe session, so a double click does not reserve stock twice.
 */
export function cartHash(
  lines: { slug: string; quantity: number; unitPriceCents: number }[],
): string {
  const canonical = [...lines]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((l) => `${l.slug}:${l.quantity}:${l.unitPriceCents}`)
    .join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Stripe rejects an `expires_at` less than 30 minutes ahead at the moment IT receives the
 * request, so the hold carries a minute of slack for the round trip.
 */
export function holdUntil(now = new Date()): Date {
  return new Date(now.getTime() + CHECKOUT_HOLD_MINUTES * 60_000 + 60_000);
}
