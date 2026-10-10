import Image from "next/image";
import Link from "next/link";
import { LineControls, RemoveButton } from "@/components/cart/line-controls";
import { ProductCard } from "@/components/product/product-card";
import { StockStatus } from "@/components/product/stock-status";
import { Button, Container, MediaFrame, ProductGrid } from "@/components/ui";
import { getNewArrivals } from "@/db/queries/products";
import { getCart } from "@/lib/cart-server";
import { formatPrice, getStock } from "@/lib/product";

const row =
  "grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-line py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6";

/** The bag. Reads the cookie and live prices/stock, so render it inside `<Suspense>`. */
export async function CartContents() {
  const cart = await getCart();

  if (cart.lines.length === 0 && cart.unavailable.length === 0) {
    return <EmptyBag />;
  }

  return (
    <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <div>
        <p className="type-caption text-muted">
          {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
        </p>

        <ul className="mt-4 border-t border-line">
          {cart.lines.map((line) => (
            <li key={line.slug} className={row}>
              <Link href={line.href} aria-label={line.name}>
                <MediaFrame ratio="portrait">
                  <Image
                    src={line.image.src}
                    alt={line.image.alt}
                    fill
                    quality={90}
                    sizes="(min-width: 640px) 112px, 88px"
                    className="object-cover"
                  />
                </MediaFrame>
              </Link>

              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <Link href={line.href} className="type-title link-quiet block">
                    {line.name}
                  </Link>
                  <p className="type-caption mt-1 text-muted">{formatPrice(line.priceCents)}</p>

                  {/* One stock message per line: the adjustment notice wins, then low stock
                      (unless the stepper's limit note already says so). */}
                  {line.requestedQuantity > line.quantity ? (
                    <p role="status" className="type-caption mt-2 text-danger">
                      Only {line.quantity} available, so we&apos;ve adjusted your quantity.
                    </p>
                  ) : getStock(line).state === "low-stock" && line.quantity < line.maxQuantity ? (
                    <div className="mt-2">
                      <StockStatus product={line} />
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <LineControls
                      slug={line.slug}
                      name={line.name}
                      quantity={line.quantity}
                      maxQuantity={line.maxQuantity}
                      stock={line.stock}
                      quiet={line.requestedQuantity > line.quantity}
                    />
                  </div>
                </div>
                <p className="type-title sm:text-right">{formatPrice(line.lineTotalCents)}</p>
              </div>
            </li>
          ))}

          {cart.unavailable.map((line) => (
            <li key={line.slug} className={row}>
              <MediaFrame ratio="portrait">
                {line.image ? (
                  <Image
                    src={line.image.src}
                    alt={line.image.alt}
                    fill
                    quality={90}
                    sizes="(min-width: 640px) 112px, 88px"
                    className="object-cover opacity-60"
                  />
                ) : null}
              </MediaFrame>
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  {line.href ? (
                    <Link href={line.href} className="type-title link-quiet block">
                      {line.name}
                    </Link>
                  ) : (
                    <p className="type-title">{line.name}</p>
                  )}
                  <p className="type-caption mt-2 text-danger">
                    {line.reason === "out-of-stock" ? "Out of stock" : "No longer available"}.
                    It isn&apos;t included in your subtotal.
                  </p>
                  <div className="mt-4">
                    <RemoveButton slug={line.slug} name={line.name} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside aria-label="Bag summary" className="mt-10 lg:sticky lg:top-24 lg:mt-0 lg:self-start">
        <div className="border-t border-ink pt-4">
          <p className="type-heading flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotalCents)}</span>
          </p>
          <p className="type-caption mt-3 text-muted">Complimentary shipping on every order.</p>
          {cart.unavailable.length > 0 ? (
            <p className="type-caption mt-2 text-muted">
              Unavailable pieces are not included.
            </p>
          ) : null}
          <div className="mt-6">
            <Button href="/new-arrivals" variant="secondary" className="w-full">
              Continue shopping
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Empty state: a clear next step plus a few new pieces, reusing the storefront card. */
async function EmptyBag() {
  const suggestions = await getNewArrivals(4);

  return (
    <>
      <div className="mt-8">
        <p className="type-body text-muted">Your bag is empty.</p>
        <Button href="/new-arrivals" className="mt-6">
          Continue shopping
        </Button>
      </div>

      {suggestions.length > 0 ? (
        <section aria-labelledby="bag-suggestions" className="-mx-gutter mt-section">
          <Container className="pb-6">
            <h2 id="bag-suggestions" className="type-heading">
              New Arrivals
            </h2>
          </Container>
          <ProductGrid>
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      ) : null}
    </>
  );
}
