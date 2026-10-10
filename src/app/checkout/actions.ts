"use server";

import { redirect } from "next/navigation";
import { createCheckoutUrl } from "@/lib/checkout-server";
import { CheckoutError } from "@/lib/stripe";

export type CheckoutState = { error: string } | null;

/**
 * Starts checkout for the current bag and sends the browser to Stripe. It takes NO arguments
 * on purpose: the bag is read server-side and priced from the database.
 */
export async function startCheckout(): Promise<CheckoutState> {
  let url: string;
  try {
    url = await createCheckoutUrl();
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    console.error("Checkout failed", e);
    return { error: "We couldn't start checkout. Please try again in a moment." };
  }
  // Outside the try: redirect() works by throwing.
  redirect(url);
}
