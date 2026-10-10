"use client";

import { useState, useTransition } from "react";
import { removeFromCart, setCartQuantity } from "@/app/cart/actions";
import type { CartActionResult } from "@/app/cart/actions";
import { CART_MAX_QUANTITY } from "@/lib/cart";

const step =
  "type-label inline-flex size-control-sm items-center justify-center border border-line " +
  "transition-colors duration-150 hover:border-ink disabled:pointer-events-none disabled:opacity-40";

/**
 * Polite announcement through the page-level live region (`#bag-status`). The row that
 * triggered a removal unmounts, so it can't announce its own removal.
 */
function announce(message: string) {
  const el = document.getElementById("bag-status");
  if (el) el.textContent = message;
}

/** After a removal the focused button is gone; hand focus to the heading so it isn't lost. */
function restoreFocus() {
  document.getElementById("bag-heading")?.focus();
}

/**
 * Quantity stepper and remove for one cart line. `maxQuantity` comes from live stock on the
 * server render, so "+" is disabled at the limit; the action re-checks regardless.
 */
export function LineControls({
  slug,
  name,
  quantity,
  maxQuantity,
  stock,
  quiet = false,
}: {
  slug: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  stock: number;
  /** Hide the limit note when the line already shows its own stock message. */
  quiet?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CartActionResult | null>(null);

  function run(action: () => Promise<CartActionResult>, then?: (r: CartActionResult) => void) {
    startTransition(async () => {
      const r = await action();
      setResult(r);
      then?.(r);
    });
  }

  const atLimit = quantity >= maxQuantity;
  // Distinguish "that's all we have" from the per-piece cap, so the reason is honest.
  const limitNote =
    stock <= CART_MAX_QUANTITY
      ? `You have all ${stock} that are available.`
      : `Limit of ${CART_MAX_QUANTITY} per piece.`;

  return (
    <div aria-busy={pending}>
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center transition-opacity ${pending ? "opacity-60" : ""}`}
          role="group"
          aria-label={`Quantity of ${name}`}
        >
          <button
            type="button"
            className={step}
            aria-label={`Decrease quantity of ${name}`}
            disabled={pending || quantity <= 1}
            onClick={() =>
              run(() => setCartQuantity(slug, quantity - 1), (r) =>
                announce(r.ok ? `${name} quantity ${r.quantity}.` : r.message),
              )
            }
          >
            &minus;
          </button>
          <span
            className="type-body inline-flex h-control-sm min-w-10 items-center justify-center tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            className={step}
            aria-label={`Increase quantity of ${name}`}
            disabled={pending || atLimit}
            onClick={() =>
              run(() => setCartQuantity(slug, quantity + 1), (r) =>
                announce(r.ok ? `${name} quantity ${r.quantity}.` : r.message),
              )
            }
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="type-label link-quiet disabled:opacity-40"
          disabled={pending}
          aria-label={`Remove ${name} from bag`}
          onClick={() =>
            run(() => removeFromCart(slug), () => {
              announce(`${name} removed from bag.`);
              restoreFocus();
            })
          }
        >
          Remove
        </button>
      </div>

      {atLimit && !quiet ? <p className="type-caption mt-2 text-muted">{limitNote}</p> : null}
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
      onClick={() =>
        startTransition(async () => {
          await removeFromCart(slug);
          announce(`${name} removed from bag.`);
          restoreFocus();
        })
      }
    >
      Remove
    </button>
  );
}
