import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

/**
 * Header label. Reads the session, so render it inside `<Suspense>` to keep the rest of the
 * header in the static shell. Cosmetic only: authorization never relies on this read.
 */
export async function AccountLink() {
  const user = await getCurrentUser();
  return (
    <Link href={user ? "/account" : "/sign-in"} className="type-label link-quiet">
      {user ? "Account" : "Sign in"}
    </Link>
  );
}
