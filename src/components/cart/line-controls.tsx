"use client";

import { useState, useTransition } from "react";
import { removeFromCart, setCartQuantity } from "@/app/cart/actions";
import type { CartActionResult } from "@/app/cart/actions";

const step =
  "type-label inline-flex size-control-sm items-center justify-center border border-line " +
  "transition-colors duration-150 hover:border-ink disabled:pointer-events-none disabled:opacity-40";

/**
 * Quantity stepper and remove for one cart line. `maxQuantity` comes from live stock on the
 * server render, so "+" is disabled at the limit; the action re-checks regardless.
 */
export function LineControls({
  slug,
  name,
  quantity,
  maxQuantity,
}: {
  slug: string;
  name: string;
  quantity: number;
  maxQuantity: number;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CartActionResult | null>(null);

  function run(action: () => Promise<CartActionResult>) {
    startTransition(async () => setResult(await action()));
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex items-center" role="group" aria-label={`Quantity of ${name}`}>
          <button
            type="button"
            className={step}
            aria-label={`Decrease quantity of ${name}`}
            disabled={pending || quantity <= 1}
            onClick={() => run(() => setCartQuantity(slug, quantity - 1))}
          >
            &minus;
          </button>
          <span className="type-body inline-flex h-control-sm min-w-10 items-center justify-center tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className={step}
            aria-label={`Increase quantity of ${name}`}
            disabled={pending || quantity >= maxQuantity}
            onClick={() => run(() => setCartQuantity(slug, quantity + 1))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="type-label link-quiet disabled:opacity-40"
          disabled={pending}
          aria-label={`Remove ${name} from bag`}
          onClick={() => run(() => removeFromCart(slug))}
        >
          Remove
        </button>
      </div>
      {quantity >= maxQuantity ? (
        <p className="type-caption mt-2 text-muted">Maximum available in your bag.</p>
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className="type-caption mt-2 text-danger">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}

/** Stand-alone remove, for lines that can no longer be bought and so have no stepper. */
export function RemoveButton({ slug, name }: { slug: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="type-label link-quiet disabled:opacity-40"
      disabled={pending}
      aria-label={`Remove ${name} from bag`}
      onClick={() => startTransition(async () => void (await removeFromCart(slug)))}
    >
      Remove
    </button>
  );
}
