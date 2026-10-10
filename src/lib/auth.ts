import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { validateAuthSecret } from "@/lib/auth-secret";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-validation";

// The build only collects route metadata and never signs anything, so it must not
// need production secrets. Every runtime start validates (see `src/instrumentation.ts`).
const secret =
  process.env.NEXT_PHASE === "phase-production-build" ? undefined : validateAuthSecret();

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL].filter((o): o is string => Boolean(o)),
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
    // No mail transport yet; revisit before accounts hold orders or addresses.
    requireEmailVerification: false,
  },
  session: {
    // Persistent sessions: 30 days, refreshed at most once a day while in use.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Cosmetic reads only. Authorization checks bypass it (see `src/lib/session.ts`).
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // In-memory limiting is per-instance and useless on serverless.
  rateLimit: { enabled: true, storage: "database" },
  user: {
    additionalFields: {
      // `input: false` so a client can never set it at sign-up or via update-user.
      // Promote admins with `npm run db:make-admin`.
      role: { type: "string", required: false, defaultValue: "customer", input: false },
    },
  },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  // Must stay last.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
