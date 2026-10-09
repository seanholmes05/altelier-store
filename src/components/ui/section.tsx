import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: "paper" | "ink";
  /** Remove vertical padding (e.g. hero or flush product grids). */
  flush?: boolean;
  /** Hairline above the section. */
  divided?: boolean;
};

/** Vertical-rhythm wrapper. Pair with <Container> for horizontal gutters. */
export function Section({
  tone = "paper",
  flush,
  divided,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        tone === "ink" ? "on-ink bg-ink text-inverse" : "bg-paper text-ink",
        !flush && "py-section",
        divided && "border-t border-line",
        className,
      )}
      {...props}
    />
  );
}
