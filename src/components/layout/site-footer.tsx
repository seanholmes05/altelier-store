import Link from "next/link";
import { footerColumns } from "@/data/catalog";
import { Container } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="on-ink bg-ink text-inverse">
      <Container className="py-section">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h2 className="type-label">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((label) => (
                  <li key={label}>
                    <Link href="#" className="type-caption link-quiet">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1">
            <h2 className="type-label">Altelier</h2>
            <p className="type-caption mt-4 max-w-xs">
              Considered pieces, made to be worn for years.
            </p>
          </div>
        </div>
        <p className="type-caption mt-12 border-t border-white/20 pt-6">
          &copy; Altelier. Sample storefront content.
        </p>
      </Container>
    </footer>
  );
}
