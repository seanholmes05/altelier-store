import Link from "next/link";
import { getCart, readCartEntries } from "@/lib/cart-server";

/**
 * Header link with the item count. Reads the cart cookie and, when it is non-empty, live
 * stock, so the number always matches the bag page (it never counts unavailable or
 * over-stock units). Render it inside `<Suspense>`.
 */
export async function BagLink() {
  const count = (await readCartEntries()).length === 0 ? 0 : (await getCart()).itemCount;
  return (
    <Link href="/cart" className="type-label link-quiet">
      Bag ({count})
    </Link>
  );
}
