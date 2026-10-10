"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/cn";

const items = [
  { label: "Overview", href: "/account" },
  { label: "Details", href: "/account/details" },
] as const;

const item =
  "type-label block whitespace-nowrap border-b py-3 md:-ml-px md:border-b-0 md:border-l md:py-2 md:pl-4";
const active = "border-ink text-ink";
const inactive = "border-transparent text-muted hover:text-ink";

/**
 * Account sections as a horizontal underline strip on mobile and a vertical rail from `md`.
 * Static (no session read), so it sits outside the layout's Suspense boundary.
 */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
      <ul className="flex gap-6 overflow-x-auto border-b border-line md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:border-l">
        {items.map(({ label, href }) => {
          const current = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(item, current ? active : inactive)}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <SignOutButton variant="link" className={cn(item, inactive, "disabled:opacity-40")} />
        </li>
      </ul>
    </nav>
  );
}
