// Fail-closed validation for the Better Auth signing secret.
//
// Better Auth only logs a warning for short or low-entropy secrets, so a guessable
// value would be accepted and could be used to forge HS256-signed tokens (session
// data, verification links). This module refuses to start instead.
//
// Pure and free of `@/db` imports so it can run in `instrumentation.ts` at server start.

const MIN_BYTES = 32;
/** 32 random bytes almost always contain 25+ distinct values; this only trips on patterned input. */
const MIN_DISTINCT_BYTES = 16;
const MIN_DISTINCT_CHARS = 12;

/** Substrings that mark a value as a placeholder or example rather than generated output. */
const PLACEHOLDERS = [
  "secret",
  "change",
  "password",
  "example",
  "default",
  "placeholder",
  "better-auth",
  "your-",
  "12345",
];

const GENERATE_HINT =
  "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"";

type Env = Record<string, string | undefined>;

/** Decodes `value` as hex and as base64/base64url, returning every plausible byte string. */
function decodeCandidates(value: string): Buffer[] {
  const out: Buffer[] = [];
  if (/^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0) {
    out.push(Buffer.from(value, "hex"));
  }
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) {
    out.push(Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
  }
  return out;
}

/** Returns why `value` is unacceptable, or `null` when it passes. Never echoes the value. */
function weakness(value: string): string | null {
  if (/\s/.test(value)) return "it contains whitespace";
  const lower = value.toLowerCase();
  if (PLACEHOLDERS.some((p) => lower.includes(p))) return "it looks like a placeholder or example value";
  if (new Set(value).size < MIN_DISTINCT_CHARS) return "it uses too few distinct characters";

  const strong = decodeCandidates(value).some(
    (bytes) => bytes.length >= MIN_BYTES && new Set(bytes).size >= MIN_DISTINCT_BYTES,
  );
  if (!strong) {
    return `it is not at least ${MIN_BYTES} random bytes encoded as hex or base64`;
  }
  return null;
}

function check(name: string, value: string): void {
  const reason = weakness(value);
  if (reason) {
    throw new Error(`${name} is not acceptable: ${reason}. ${GENERATE_HINT}`);
  }
}

/** Values from a `BETTER_AUTH_SECRETS` list (`version:secret,version:secret`). */
function versionedSecrets(raw: string): string[] {
  return raw.split(",").map((entry) => {
    const trimmed = entry.trim();
    const colon = trimmed.indexOf(":");
    const value = colon === -1 ? "" : trimmed.slice(colon + 1).trim();
    if (!value) {
      throw new Error('BETTER_AUTH_SECRETS entries must look like "<version>:<secret>".');
    }
    return value;
  });
}

/**
 * Validates every signing secret Better Auth could read from the environment and
 * returns the one to use. Throws, with a message that never contains the secret,
 * when none is set or any configured one is weak.
 *
 * Supply the value from your secret manager (or host environment settings), not a
 * file in the repository.
 */
export function validateAuthSecret(env: Env = process.env): string {
  // Mirrors Better Auth's own `options.secret || BETTER_AUTH_SECRET || AUTH_SECRET` lookup.
  const primary = env.BETTER_AUTH_SECRET?.trim() || env.AUTH_SECRET?.trim() || "";
  if (!primary) {
    throw new Error(
      `BETTER_AUTH_SECRET is not set. Supply at least ${MIN_BYTES} random bytes from your secret manager. ${GENERATE_HINT}`,
    );
  }

  check(env.BETTER_AUTH_SECRET?.trim() ? "BETTER_AUTH_SECRET" : "AUTH_SECRET", primary);

  // Better Auth also accepts these, and would use them without its own checks failing closed.
  const auth = env.AUTH_SECRET?.trim();
  if (auth) check("AUTH_SECRET", auth);
  const rotation = env.BETTER_AUTH_SECRETS?.trim();
  if (rotation) versionedSecrets(rotation).forEach((v) => check("BETTER_AUTH_SECRETS", v));

  return primary;
}
