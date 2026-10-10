import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/** The only shape of a user that leaves this module. Never the raw session row or token. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

type RawSession = Awaited<ReturnType<typeof auth.api.getSession>>;

function toUser(session: RawSession): CurrentUser | null {
  if (!session) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: role === "admin" ? "admin" : "customer" };
}

/**
 * Cosmetic read (header label). May be served from the 5-minute signed cookie cache, so a
 * revoked session or changed role can still look valid. Never use it to authorize.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> =>
  toUser(await auth.api.getSession({ headers: await headers() })),
);

/** Authoritative read: bypasses the cookie cache and checks the session row in the database. */
export const getVerifiedUser = cache(async (): Promise<CurrentUser | null> =>
  toUser(
    await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    }),
  ),
);

/**
 * For customer pages, Server Actions and route handlers. Sends anonymous visitors to
 * sign-in and brings them back to `next` afterwards.
 *
 * With Cache Components this reads request data, so call it only from a component behind
 * `<Suspense>`, never at the top level of a layout.
 */
export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getVerifiedUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * For admin pages, Server Actions and route handlers. Signed-in non-admins get a 404 so the
 * area does not advertise itself. Role is read from the database on every call.
 */
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== "admin") notFound();
  return user;
}
