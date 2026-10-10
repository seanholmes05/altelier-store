import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account | Altelier",
  robots: { index: false },
};

const tile = "block border border-line p-6 transition-colors duration-150 hover:border-ink";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <>
      <h2 className="type-title">Welcome back, {firstName}</h2>
      <p className="type-body mt-2 text-muted">Signed in as {user.email}.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li>
          <Link href="/account/details" className={tile}>
            <span className="type-heading block">Account information</span>
            <span className="type-caption mt-2 block text-muted">
              Your name, email and when you joined.
            </span>
          </Link>
        </li>
        <li>
          <Link href="/new-arrivals" className={tile}>
            <span className="type-heading block">New arrivals</span>
            <span className="type-caption mt-2 block text-muted">
              The latest pieces, newest first.
            </span>
          </Link>
        </li>
        {user.role === "admin" ? (
          <li>
            <Link href="/admin" className={tile}>
              <span className="type-heading block">Admin</span>
              <span className="type-caption mt-2 block text-muted">Manage the store.</span>
            </Link>
          </li>
        ) : null}
      </ul>
    </>
  );
}
