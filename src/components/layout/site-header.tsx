import Link from "next/link";
import { navLinks } from "@/data/catalog";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="relative mx-auto grid h-14 w-full max-w-page grid-cols-[1fr_auto_1fr] items-center px-gutter md:h-16">
        <div className="flex items-center">
          <MobileMenu links={navLinks} />
          <nav aria-label="Primary" className="hidden md:block">
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

        <Link href="/" className="text-lg font-semibold uppercase tracking-[0.3em] md:text-xl">
          Altelier
        </Link>

        <ul className="flex items-center justify-end gap-4 md:gap-6">
          <li className="hidden md:block">
            <Link href="#" className="type-label link-quiet">
              Search
            </Link>
          </li>
          <li>
            <Link href="#" className="type-label link-quiet">
              Bag (0)
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
