import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

const ratios = {
  /** Product and editorial tiles. */
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  /** Desktop hero. */
  landscape: "aspect-video",
  /** Mobile hero is tall; becomes 16:9 from md up. */
  hero: "aspect-[2/3] md:aspect-video",
} as const;

type MediaFrameProps = ComponentPropsWithoutRef<"div"> & {
  ratio?: keyof typeof ratios;
  /** Ground colour shown behind (or instead of) the image. */
  tone?: "wash" | "ink";
};

/**
 * Fixed-ratio, cover-fit image slot with a neutral ground so layout never
 * shifts. Put a next/image (with `fill` and `className="object-cover"`) inside.
 */
export function MediaFrame({
  ratio = "portrait",
  tone = "wash",
  className,
  ...props
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        tone === "ink" ? "bg-ink text-inverse" : "bg-wash",
        ratios[ratio],
        className,
      )}
      {...props}
    />
  );
}
