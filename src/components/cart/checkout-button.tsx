"use client";

import { useActionState } from "react";
import { startCheckout } from "@/app/checkout/actions";
import type { CheckoutState } from "@/app/checkout/actions";
import { Button } from "@/components/ui";

/**
 * Sends the shopper to Stripe. The action takes no input: the bag is read and priced on the
 * server. On success the server redirects, so only errors come back here.
 */
export function CheckoutButton() {
  const [state, action, pending] = useActionState<CheckoutState>(startCheckout, null);

  return (
    <form action={action}>
      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Taking you to checkout…" : "Checkout"}
      </Button>
      <div role="alert" aria-live="assertive">
        {state?.error ? (
          <p className="type-caption mt-3 text-danger">{state.error}</p>
        ) : null}
      </div>
    </form>
  );
}
