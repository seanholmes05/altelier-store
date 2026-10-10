import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

// Same-origin, so no baseURL. Type-only import of `auth`: nothing server-side is bundled.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
