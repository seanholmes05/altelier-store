import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic check only: a cookie's presence proves nothing about its validity. The
// authoritative check is `requireUser()` / `requireAdmin()` in `src/lib/session.ts`, close
// to the data. This file must not import `@/lib/auth` or `@/db`.
//
// It deliberately does not bounce signed-in visitors away from /sign-in: a stale cookie
// would loop between here and the server-side check. The sign-in page does that itself
// after verifying the session.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
