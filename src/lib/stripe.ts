import "server-only";
import Stripe from "stripe";

/** A message that is safe to show a shopper. Anything else is logged and shown generically. */
export class CheckoutError extends Error {}

let client: Stripe | undefined;

/**
 * The one Stripe client. Fails closed: with no key configured, checkout is unavailable rather
 * than half-working. Use a restricted key (`rk_…`) limited to Checkout Sessions and Refunds,
 * from your secret manager or host env settings, never a committed file. Develop against a
 * Stripe sandbox, not live mode.
 */
export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    console.error("STRIPE_SECRET_KEY is not set; checkout is disabled.");
    throw new CheckoutError("Checkout isn't available right now. Please try again soon.");
  }
  if (!/^(rk|sk)_(test|live)_/.test(key)) {
    throw new Error("STRIPE_SECRET_KEY does not look like a Stripe secret or restricted key.");
  }
  client = new Stripe(key);
  return client;
}
