import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { validateAuthSecret } from "@/lib/auth-secret";

// The build only collects route metadata and never signs anything, so it must not
// need production secrets. Every runtime start validates (see `src/instrumentation.ts`).
const secret =
  process.env.NEXT_PHASE === "phase-production-build" ? undefined : validateAuthSecret();

export const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
});
