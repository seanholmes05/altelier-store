// Runs once when the server starts and must finish before it accepts requests,
// so a missing or weak auth secret stops the process instead of being accepted.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateAuthSecret } = await import("@/lib/auth-secret");
    validateAuthSecret();
  }
}
