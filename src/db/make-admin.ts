// Promote an existing user: `npm run db:make-admin -- someone@example.com`
// Add `--demote` to set the role back to `customer`. There is deliberately no UI for this.
import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });
config();

async function main() {
  const args = process.argv.slice(2);
  const demote = args.includes("--demote");
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run db:make-admin -- <email> [--demote]");
    process.exit(1);
  }

  // Imported lazily so dotenv has populated DATABASE_URL before `@/db` checks it.
  const { db } = await import("./index");
  const { user } = await import("./schema");

  const role = demote ? "customer" : "admin";
  const updated = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email))
    .returning({ id: user.id });

  if (updated.length === 0) {
    console.error(`No user with email ${email}. They must sign up first.`);
    process.exit(1);
  }
  console.log(`${email} is now ${role}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
