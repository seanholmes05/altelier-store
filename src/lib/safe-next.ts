// Pure: no `@/db` import, usable from client components and the proxy.

/**
 * Returns `value` only when it is a same-site absolute path (`/account`, `/admin?x=1`),
 * otherwise `fallback`. Rejects protocol-relative (`//evil.com`), backslash and
 * control-character tricks so a `?next=` parameter can never send a user off-site.
 */
export function safeNext(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
