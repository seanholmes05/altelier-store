import { getStock, type Product } from "@/lib/product";
import { cn } from "@/lib/cn";

const dot = {
  "in-stock": "bg-ink",
  "low-stock": "bg-danger",
  "out-of-stock": "border border-muted bg-transparent",
} as const;

/** Stock indicator: a small square marker plus a plain-text label. */
export function StockStatus({ product }: { product: Pick<Product, "stock"> }) {
  const { state, label } = getStock(product);

  return (
    <p className="type-caption flex items-center gap-2" data-stock-state={state}>
      <span aria-hidden className={cn("inline-block size-2", dot[state])} />
      <span className={state === "low-stock" ? "text-danger" : undefined}>{label}</span>
    </p>
  );
}
