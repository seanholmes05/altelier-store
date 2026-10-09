import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  /** Drop the side gutters, e.g. for full-bleed imagery. */
  bleed?: boolean;
  /** Constrain to a reading width. */
  prose?: boolean;
};

/** Page-width wrapper: responsive gutters, centred, capped at --container-page. */
export function Container({ bleed, prose, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        prose ? "max-w-prose" : "max-w-page",
        !bleed && "px-gutter",
        className,
      )}
      {...props}
    />
  );
}
