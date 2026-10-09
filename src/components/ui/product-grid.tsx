import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MediaFrame } from "./media-frame";

/** Flush grid: 2 columns on mobile, 3 from md, 4 from lg. Tiles touch. */
export function ProductGrid({ className, ...props }: ComponentPropsWithoutRef<"ul">) {
  return (
    <ul className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4", className)} {...props} />
  );
}

type ProductTileProps = {
  /** An <Image fill className="object-cover" /> or similar. */
  media?: ReactNode;
  name: string;
  price?: string;
};

/** Image on top (3:4), name and price below with side padding. */
export function ProductTile({ media, name, price }: ProductTileProps) {
  return (
    <li>
      <MediaFrame ratio="portrait">{media}</MediaFrame>
      <div className="px-4 pb-6 pt-3">
        <p className="type-title">{name}</p>
        {price ? <p className="type-caption text-muted">{price}</p> : null}
      </div>
    </li>
  );
}
