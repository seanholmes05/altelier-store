"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCart } from "@/app/cart/actions";
import type { CartActionResult } from "@/app/cart/actions";
import { Button } from "@/components/ui";

/**
 * Adds one unit to the bag via a Server Action. The server checks live stock and may add
 * fewer than asked or refuse; whatever it says is shown here. `soldOut` only reflects the
 * (cached) product page, so the action is still the authority.
 */
export function AddToBag({ slug, soldOut }: { slug: string; soldOut: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CartActionResult | null>(null);

  if (soldOut) {
    return (
      <Button variant="secondary" disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  return (
    <div>
      <Button
        className="w-full"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(await addToCart(slug));
          })
        }
      >
        {pending ? "Adding…" : "Add to bag"}
      </Button>

      <div role="status" aria-live="polite" className="type-caption mt-3 min-h-4">
        {result?.ok ? (
          <p>
            {result.message ?? "Added to bag."}{" "}
            <Link href="/cart" className="link">
              View bag
            </Link>
          </p>
        ) : null}
        {result && !result.ok ? <p className="text-danger">{result.message}</p> : null}
      </div>
    </div>
  );
}
