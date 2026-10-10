import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { MediaFrame } from "@/components/ui";
import { formatPrice, getStock, productHref, type Product } from "@/lib/product";

/** Listing tile: 3:4 image, name, price. Shared by the homepage and related-product grids. */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const soldOut = getStock(product).state === "out-of-stock";
  const [image] = product.images;

  return (
    <li>
      <Link href={productHref(product)} className="group block">
        <MediaFrame ratio="portrait">
          <ProductImage
            src={image.src}
            alt={image.alt}
            fill
            quality={90}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
              soldOut ? "opacity-60" : ""
            }`}
          />
        </MediaFrame>
        <div className="px-4 pb-6 pt-3">
          <p className="type-title">{product.name}</p>
          <p className="type-caption text-muted">
            {soldOut ? "Out of stock" : formatPrice(product.priceCents)}
          </p>
        </div>
      </Link>
    </li>
  );
}
