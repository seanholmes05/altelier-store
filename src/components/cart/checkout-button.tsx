"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startCheckout } from "@/app/checkout/actions";
import type { CheckoutState } from "@/app/checkout/actions";
import { Button } from "@/components/ui";

/**
 * Sends the shopper to Stripe. The action takes no input: the bag is read and priced on the
 * server. On success the server redirects, so only failures come back here, with a way forward.
 */
export function CheckoutButton() {
  const [state, action, pending] = useActionState<CheckoutState>(startCheckout, null);

  return (
    <form action={action} aria-busy={pending}>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Taking you to payment…" : "Continue to payment"}
      </Button>

      {pending ? (
        <p role="status" className="type-caption mt-3 text-muted">
          Holding your pieces and opening secure payment. Please don&apos;t close this page.
        </p>
      ) : null}

      <div role="alert" aria-live="assertive">
        {state?.error ? (
          <div className="mt-3 border-l border-danger pl-3">
            <p className="type-caption text-danger">{state.error}</p>
            <p className="type-caption mt-1">
              <Link href="/cart" className="link">
                Review your bag
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </form>
  );
}
