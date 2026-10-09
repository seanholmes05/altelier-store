import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "inverse" | "ghost";
type Size = "md" | "sm";

const base =
  "type-label inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap border " +
  "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  // Solid black; inverts on hover.
  primary: "border-ink bg-ink text-inverse hover:bg-paper hover:text-ink",
  // Outlined on paper; fills on hover.
  secondary: "border-ink bg-paper text-ink hover:bg-ink hover:text-inverse",
  // For use over imagery or ink backgrounds: white text, white hairline.
  inverse: "border-inverse bg-transparent text-inverse hover:bg-inverse hover:text-ink",
  // Text-only call to action.
  ghost: "border-transparent bg-transparent text-current hover:underline hover:underline-offset-4",
};

const sizes: Record<Size, string> = {
  md: "h-control px-6",
  sm: "h-control-sm px-4",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type Shared = { variant?: Variant; size?: Size };

type ButtonAsButton = Shared & ComponentProps<"button"> & { href?: undefined };
type ButtonAsLink = Shared & Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** Square, uppercase, 48px control. Renders a <Link> when given an href. */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant, size, className, ...rest } = props;
  const classes = buttonClasses({ variant, size, className });

  if (rest.href !== undefined) {
    return <Link {...(rest as ComponentProps<typeof Link>)} className={classes} />;
  }
  const { type = "button", ...buttonProps } = rest as ComponentProps<"button">;
  return <button type={type} {...buttonProps} className={classes} />;
}
