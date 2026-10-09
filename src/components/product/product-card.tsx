import Image from "next/image";
import Link from "next/link";
import { MediaFrame } from "@/components/ui";
import { getStock, productHref, type Product } from "@/data/catalog";

/** Listing tile: 3:4 image, name, price. Shared by the homepage and related-product grids. */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const soldOut = getStock(product).state === "out-of-stock";

  return (
    <li>
      <Link href={productHref(product)} className="group block">
        <MediaFrame ratio="portrait">
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            priority={priority}
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
              soldOut ? "opacity-60" : ""
            }`}
          />
        </MediaFrame>
        <div className="px-4 pb-6 pt-3">
          <p className="type-title">{product.name}</p>
          <p className="type-caption text-muted">
            {soldOut ? "Out of stock" : product.price}
          </p>
        </div>
      </Link>
    </li>
  );
}
