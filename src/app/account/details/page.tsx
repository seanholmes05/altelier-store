import type { Metadata } from "next";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account information | Altelier",
  robots: { index: false },
};

const joined = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

export default async function AccountDetailsPage() {
  const user = await requireUser("/account/details");

  const rows = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Member since", value: joined.format(user.createdAt) },
  ];

  return (
    <>
      <h2 className="type-title">Account information</h2>
      <dl className="mt-6 border-t border-line">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="grid gap-1 border-b border-line py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
          >
            <dt className="type-label">{label}</dt>
            <dd className="type-body break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
