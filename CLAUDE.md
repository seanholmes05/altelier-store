# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # next dev
npm run build        # next build
npm run lint         # eslint (flat config, eslint.config.mjs)
npm run typecheck    # tsc --noEmit
npm run db:generate  # drizzle-kit generate (SQL migrations into ./drizzle)
npm run db:migrate   # drizzle-kit migrate
npm run db:push      # drizzle-kit push (sync schema directly, no migration files)
npm run db:seed      # tsx src/db/seed.ts (idempotent; never resets stock)
npm run db:studio    # drizzle-kit studio
```

There is no test runner configured yet.

## Setup

There is no tracked `.env.example`. Create `.env.local` (git-ignored, never commit it) in the project root and set `DATABASE_URL` (Neon pooled connection string), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`. `src/db/index.ts` throws at import time if `DATABASE_URL` is missing, so anything importing `@/db` (including `@/lib/auth` and the auth route) needs it set.

## Architecture

Next.js 16 App Router under `src/`, path alias `@/*` → `src/*`. Products, categories, stock, auth and a cookie cart are built; orders and payments have not been.

- **Database**: `src/db/index.ts` exports a Drizzle client over Neon's HTTP driver (`drizzle-orm/neon-http`). `src/db/schema.ts` is the only schema source for `drizzle.config.ts` (output dir `./drizzle`). `drizzle.config.ts` loads `.env.local` then `.env`, since drizzle-kit does not read Next's env files itself.

### Database conventions

- **Scope**: only `categories` and `products` exist. Stock is a column on `products` (no inventory table), images live in `product_images` (ordered by `position`; 0 is the primary image used on cards), and there is no currency column (USD assumed). Don't add orders, payments, reviews, wish lists or variants unless asked. The cart is the exception (below).
- **Money**: store prices as integer cents (`price_cents`), never strings or floats; format only in the UI with `formatPrice` from `src/lib/product.ts`.
- **Identifiers**: tables use integer identity PKs; products are addressed publicly by unique `slug`, which is what URLs and `Product.id` carry.
- **Stock**: `stock >= 0` (DB check); 0 means out of stock. The low-stock threshold lives in code (`getStock`), not the DB. The neon-http driver has no interactive transactions, so decrement stock with a single atomic `UPDATE ... SET stock = stock - n WHERE stock >= n`.
- **Reads**: storefront data comes only from the `'use cache'` functions in `src/db/queries/` (explicit `cacheLife`, `cacheTag('products')`); components never query `@/db` directly. Anything that mutates products or stock must call `updateTag('products')` from a Server Action (or `revalidateTag('products', 'max')` from a route handler).
- **Pure vs DB code**: `Product`, `getStock`, `formatPrice` live in `src/lib/product.ts` with no `@/db` import, so components and client code can use them without triggering the `DATABASE_URL` check.
- **Migrations**: change `schema.ts`, then `db:generate` and commit the SQL in `./drizzle`, then `db:migrate`. Use `db:push` only on a throwaway dev branch.
- **Images**: every product needs a `position` 0 image or it is not listed. Product imagery uses `quality={90}` (allowlisted in `next.config.ts` `images.qualities`) and `sizes` matching the real layout widths. Never scale a rendered image past its natural size to fake a detail view; add another `product_images` row instead.
- **Seeding**: `src/db/seed.ts` is idempotent (upsert by slug) and must never overwrite `stock`, `created_at` or existing images on re-run, so real photos are not replaced by the sample ones. "New arrivals" order is `created_at desc`.
- **Static vs DB content**: `src/data/catalog.ts` holds only static content (hero imagery, collection tiles, nav, services, footer), not products.
- **Build**: `generateStaticParams` and the cached queries hit the DB at build time, so `next build` needs a reachable, migrated and seeded database.
- **Cart**: a cookie (`altelier_cart`, HttpOnly, 30 days) holding only `slug:qty` pairs, mutated by the Server Actions in `src/app/cart/actions.ts`. Pure rules and the cookie format are in `src/lib/cart.ts`; `getCart()` in `src/lib/cart-server.ts` builds the view. It never stores or accepts a price, name or stock level: those come from the uncached `getLiveProducts` in `src/db/queries/cart.ts` on every read and mutation (the `'use cache'` storefront queries can be minutes stale, so don't use them for the cart). Quantity per line is capped at `min(stock, 10)`, at most 20 lines. Reading the cart needs request data, so render it (and `BagLink`) behind `<Suspense>`. The cart does not reserve or decrement stock; checkout must do that with the atomic `UPDATE ... WHERE stock >= n`. It is per-browser, not per-account; moving it into the database is a checkout-time decision.
- **Auth**: `src/lib/auth.ts` is the Better Auth server instance (Drizzle adapter, `provider: "pg"`, email/password enabled, `nextCookies()` plugin). `src/lib/auth-client.ts` is the React client. The HTTP surface is `src/app/api/auth/[...all]/route.ts`.
- **Auth secret (fail closed)**: Better Auth itself only warns about short or low-entropy secrets, so `src/lib/auth-secret.ts` (`validateAuthSecret`) refuses to start unless `BETTER_AUTH_SECRET` is at least 32 random bytes encoded as hex or base64, and it also rejects weak `AUTH_SECRET` / `BETTER_AUTH_SECRETS` entries and placeholder-looking values. It runs from `src/instrumentation.ts` at server start (requests return 500 if it fails) and in `src/lib/auth.ts`, except during `next build`, which must not need production secrets. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. In deployed environments supply it from the secret manager or host env settings, never a committed file. Rotating the secret invalidates existing sessions and verification links, which is the intended response to a weak or leaked value.
- **Auth tables**: `user`, `session`, `account`, `verification` and `rate_limit` live in `src/db/auth-schema.ts` (generated with `npx auth@latest generate --config src/lib/auth.ts --output src/db/auth-schema.ts`, then edited: timestamps `withTimezone`, `role` NOT NULL with a check). They use text ids, the one exception to integer identity keys. `schema.ts` re-exports them because the adapter and drizzle-kit only read that file. Re-apply the two edits if you regenerate after adding plugins.
- **Sessions and authorization**: import `getCurrentUser` (cosmetic, may use the 5-minute cookie cache), `requireUser` and `requireAdmin` from `src/lib/session.ts`; never call `auth.api.getSession` elsewhere. `requireUser`/`requireAdmin` bypass the cookie cache and read the session row. Every customer/admin page, Server Action and route handler must call them itself: layout gates (`/account`, `/admin`) don't re-run on client navigation. They read request data, so call them behind `<Suspense>`, never at the top of a layout.
- **Proxy**: `src/proxy.ts` only redirects cookie-less requests for `/account/*` and `/admin/*`. It must not import `@/lib/auth` or `@/db`, and must not redirect signed-in users away from `/sign-in` (a stale cookie would loop); the sign-in/up pages do that after verifying the session.
- **Roles**: `user.role` is `customer` (default) or `admin`, declared with `input: false` so clients can't set it. Promote or demote with `npm run db:make-admin -- <email> [--demote]`; there is no UI. Non-admins get a 404 on `/admin`.
- **Redirects**: `?next=` values must go through `safeNext` (`src/lib/safe-next.ts`) to prevent open redirects.
- **Out of scope so far**: email verification, password reset, 2FA, social login, profile editing. Sign-up is non-atomic on the Neon HTTP driver (user then account insert).

## Next.js specifics

- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, which change how caching and dynamic data access work compared with older Next.js. Check `node_modules/next/dist/docs/` before writing data-fetching or caching code, as AGENTS.md instructs.
- Tailwind v4 is wired through a Turbopack rule using `@tailwindcss/turbopack` in `next.config.ts` (there is no `postcss.config`). Theme tokens live in `src/app/globals.css` via `@theme inline`.

## Design system

Monochrome luxury-retail look defined in `src/app/globals.css`; reusable primitives are in `src/components/ui` (import from `@/components/ui`).

- Use tokens, not raw values: colours (`paper`, `ink`, `muted`, `wash`, `line`, `inverse`), `px-gutter` / `py-section` (responsive, 16px→64px and 40px→56px), `max-w-page`, `h-control` (48px) / `h-control-sm` (36px).
- Use the `type-*` roles (`type-label`, `type-heading`, `type-body`, `type-title`, `type-caption`, `type-statement`) rather than ad-hoc size/weight combinations. Uppercase bold is reserved for labels, buttons and section headings.
- Corners are square (`--radius-*` is cleared, so `rounded-*` utilities don't exist). Borders are 1px `border-line` or `border-ink`. There is no dark mode.
- Product imagery is 3:4 (`MediaFrame`), in a flush grid of 2 columns on mobile, 3 from `md`, 4 from `lg` (`ProductGrid`).
- Links are underlined text (`TextLink`, `link`, `link-quiet`), not coloured. Sections that sit on `bg-ink` need the `on-ink` class (`<Section tone="ink">` adds it) so focus outlines stay visible.
