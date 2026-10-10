import Image from "next/image";
import Link from "next/link";
import { MediaFrame } from "@/components/ui";
import { formatPrice } from "@/lib/product";

export type SummaryItem = {
  id: string | number;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl?: string | null;
  imageAlt?: string | null;
  href?: string;
};

/**
 * Read-only items and totals, shared by the checkout review and the order confirmation. It only
 * formats numbers it is given; every figure comes from the server (live cart or stored order).
 */
export function OrderSummary({
  items,
  subtotalCents,
  shippingCents = 0,
  taxCents = 0,
  totalCents,
}: {
  items: SummaryItem[];
  subtotalCents: number;
  shippingCents?: number;
  taxCents?: number;
  totalCents: number;
}) {
  return (
    <div>
      <ul className="border-t border-line">
        {items.map((item) => {
          const name = item.href ? (
            <Link href={item.href} className="link-quiet">
              {item.name}
            </Link>
          ) : (
            item.name
          );
          return (
            <li
              key={item.id}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-4 border-b border-line py-4"
            >
              <MediaFrame ratio="portrait">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt ?? ""}
                    fill
                    quality={90}
                    sizes="72px"
                    className="object-cover"
                  />
                ) : null}
              </MediaFrame>
              <div className="min-w-0">
                <p className="type-title">{name}</p>
                <p className="type-caption mt-1 text-muted">
                  Qty {item.quantity} &times; {formatPrice(item.unitPriceCents)}
                </p>
              </div>
              <p className="type-title">{formatPrice(item.lineTotalCents)}</p>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 space-y-2">
        <div className="type-body flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatPrice(subtotalCents)}</dd>
        </div>
        <div className="type-body flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd>{shippingCents === 0 ? "Complimentary" : formatPrice(shippingCents)}</dd>
        </div>
        {taxCents > 0 ? (
          <div className="type-body flex justify-between">
            <dt className="text-muted">Tax</dt>
            <dd>{formatPrice(taxCents)}</dd>
          </div>
        ) : null}
        <div className="type-heading flex justify-between border-t border-ink pt-3">
          <dt>Total</dt>
          <dd>{formatPrice(totalCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
