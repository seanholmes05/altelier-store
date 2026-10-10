"use client";

import Link from "next/link";
import { useState } from "react";

type Props = { links: ReadonlyArray<{ label: string; href: string }> };

/** Disclosure menu below `lg`. From `lg` up the header shows the links inline (six need ~900px). */
export function MobileMenu({ links }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="type-label inline-flex h-control-sm items-center"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <nav
        id="mobile-menu"
        aria-label="Primary"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-paper px-gutter pb-6 pt-2"
      >
        <ul>
          {links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                className="type-heading block border-b border-line py-4"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
