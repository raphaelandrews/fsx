# Project Context

This project was migrated from Next.js + Supabase + PostgreSQL to Better-T-Stack (TanStack Start, tRPC, Better Auth, SQLite/D1). See `REWRITING.md` for architecture decisions and best practices. The `source-project/` directory contains the old codebase as reference.

## Database Migration (Supabase → D1)

Data is migrated from the old Supabase Postgres into D1 via `packages/db/src/migrate.ts`:

- **Remote**: `bun run db:migrate` reads Postgres (`DATABASE_URL` in `packages/db/.env`), applies
  all `DB.md` transforms, and writes `packages/db/migration-data.sql` (idempotent — wipes then
  inserts). Apply with `bunx wrangler d1 execute <DATABASE_ID> --remote --file=./packages/db/migration-data.sql`.
- **Local**: `bun run db:migrate:local` does the same into the local Miniflare D1
  (`.alchemy/miniflare/v3`). **Stop `alchemy dev` first** (`pkill -f alchemy.run.ts`) — a running dev
  server holds a stale in-memory D1 connection and will not see the migrated data.

Migration gotchas:
- `@fsx/db`'s `miniflare` version must match alchemy's (`4.20260424.0`); otherwise seed/migrate
  write to a different SQLite file than `alchemy dev` reads.
- D1 caps each SQL statement at 100 KB — the migration batches INSERTs accordingly.
- The migration preserves `id`s (required for FKs) except `posts.id` (UUID → fresh autoincrement),
  and preserves `created_at`/`updated_at` for `players` and `posts`.

## Frontend conventions

- **shadcn/react (Base UI) triggers render a `<button>`.** When a trigger wraps a `Button`, use the
  `render` prop (`<TooltipTrigger render={<Button/>}>`) instead of nesting — nesting produces
  `<button>`-in-`<button>` hydration errors.
- **Always pass an explicit `timeZone`** to `Intl.DateTimeFormat`/`toLocaleString`. The server runs
  in UTC (Cloudflare) and the client in the user's timezone; omitting `timeZone` causes SSR/client
  hydration mismatches.
- **CSP** (`packages/api/src/security-headers.ts`) adds `unsafe-eval` only in dev (Vite tooling
  needs it); production stays strict. The Cloudflare analytics beacon is gated on
  `VITE_CLOUDFLARE_ANALYTICS_TOKEN`.
- Routes sharing a URL prefix (e.g. `/noticias` list + `/noticias/$slug` detail) must use the
  `route.tsx` (layout with `<Outlet/>`) + `index.tsx` + `$param.tsx` directory structure. A flat
  `foo.tsx` + `foo.$id.tsx` pair makes `$id` a child of the list route, which then needs an
  `<Outlet/>` to render.
- **Only write comments when strictly necessary to understand the code.** Skip commentary that
  just restates what the code does; reserve comments for non-obvious "why" decisions, gotchas,
  or invariants that aren't clear from reading the code itself.

<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->
