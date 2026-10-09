import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type TextLinkProps = ComponentProps<typeof Link> & {
  /** "underline" is always underlined; "quiet" underlines on hover only. */
  tone?: "underline" | "quiet";
};

/** Inline text link: inherits colour, underline-only affordance. */
export function TextLink({ tone = "underline", className, ...props }: TextLinkProps) {
  return <Link className={cn(tone === "quiet" ? "link-quiet" : "link", className)} {...props} />;
}
