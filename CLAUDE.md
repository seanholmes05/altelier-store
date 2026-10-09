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
npm run db:studio    # drizzle-kit studio
```

There is no test runner configured yet.

## Setup

Copy `.env.example` to `.env.local` and set `DATABASE_URL` (Neon pooled connection string), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`. `src/db/index.ts` throws at import time if `DATABASE_URL` is missing, so anything importing `@/db` (including `@/lib/auth` and the auth route) needs it set.

## Architecture

Next.js 16 App Router under `src/`, path alias `@/*` → `src/*`. This is a bare scaffold: ecommerce features, UI, payments and auth flows have not been built.

- **Database**: `src/db/index.ts` exports a Drizzle client over Neon's HTTP driver (`drizzle-orm/neon-http`). `src/db/schema.ts` is currently empty and is the only schema source for `drizzle.config.ts` (output dir `./drizzle`). `drizzle.config.ts` loads `.env.local` then `.env`, since drizzle-kit does not read Next's env files itself.
- **Auth**: `src/lib/auth.ts` is the Better Auth server instance (Drizzle adapter, `provider: "pg"`, email/password enabled, `nextCookies()` plugin). `src/lib/auth-client.ts` is the React client. The HTTP surface is `src/app/api/auth/[...all]/route.ts`.
- **Auth tables don't exist yet**: Better Auth needs its tables added to `src/db/schema.ts` (generate with `npx @better-auth/cli generate`), then `db:push` or `db:generate` + `db:migrate`. The adapter resolves tables from the schema passed to `drizzle()`, so schema must be exported through `src/db/schema.ts`.

## Next.js specifics

- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, which change how caching and dynamic data access work compared with older Next.js. Check `node_modules/next/dist/docs/` before writing data-fetching or caching code, as AGENTS.md instructs.
- Tailwind v4 is wired through a Turbopack rule using `@tailwindcss/turbopack` in `next.config.ts` (there is no `postcss.config`). Theme tokens live in `src/app/globals.css` via `@theme inline`.
