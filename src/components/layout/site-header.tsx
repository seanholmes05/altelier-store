import Link from "next/link";
import { Suspense } from "react";
import { BagLink } from "@/components/cart/bag-link";
import { navLinks } from "@/data/catalog";
import { AccountLink } from "./account-link";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="relative mx-auto grid h-14 w-full max-w-page grid-cols-[1fr_auto_1fr] items-center px-gutter md:h-16">
        <div className="flex items-center">
          <MobileMenu links={navLinks} />
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex gap-6">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="type-label link-quiet">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" className="text-base font-semibold uppercase tracking-[0.2em] md:text-xl md:tracking-[0.3em]">
          Altelier
        </Link>

        <ul className="flex items-center justify-end gap-3 whitespace-nowrap md:gap-6">
          <li className="hidden md:block">
            <Link href="#" className="type-label link-quiet">
              Search
            </Link>
          </li>
          <li>
            {/* Fallback links to /account, which sends anonymous visitors on to sign-in. */}
            <Suspense
              fallback={
                <Link href="/account" className="type-label link-quiet">
                  Account
                </Link>
              }
            >
              <AccountLink />
            </Suspense>
          </li>
          <li>
            <Suspense
              fallback={
                <Link href="/cart" className="type-label link-quiet">
                  Bag
                </Link>
              }
            >
              <BagLink />
            </Suspense>
          </li>
        </ul>
      </div>
    </header>
  );
}
