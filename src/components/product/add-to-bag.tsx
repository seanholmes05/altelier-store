"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/**
 * Purchase action. There is no cart yet, so this only gives local feedback;
 * wire `onAdd` to the cart once it exists.
 */
export function AddToBag({ soldOut, onAdd }: { soldOut: boolean; onAdd?: () => void }) {
  const [added, setAdded] = useState(false);

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
        onClick={() => {
          onAdd?.();
          setAdded(true);
        }}
      >
        {added ? "Added to bag" : "Add to bag"}
      </Button>
      <p className="sr-only" role="status" aria-live="polite">
        {added ? "Added to bag" : ""}
      </p>
    </div>
  );
}
