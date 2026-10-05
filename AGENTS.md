# Project Context

This project was migrated from Next.js + Supabase + PostgreSQL to Better-T-Stack (TanStack Start, tRPC, Better Auth, SQLite/D1). See `REWRITING.md` for architecture decisions and best practices. The `source-project/` directory contains the old codebase as reference.

## Database

The Supabase→D1 data migration is complete and `packages/db/src/migrate.ts` has been removed.

Local Dev D1 gotchas:
- `@fsx/db`'s `miniflare` version must match alchemy's (`4.20260424.0`); otherwise seed writes to a
  different SQLite file than `alchemy dev` reads. `bun run check:runtime` enforces this and the
  pinned compatibility date; see "Upgrading the Cloudflare toolchain" in `operations/runbook.mdx`.
- New Drizzle schema migrations (e.g. `0002_peaceful_masked_marvel.sql`) must go through `alchemy dev`'s
  migration tracker — do NOT apply them manually via raw `sqlite3` against `.alchemy/miniflare/v3/d1/…sqlite`.
  A raw apply creates the table but never records it in `d1_migrations`, so the next `alchemy dev` startup
  re-runs migrations and fails with `D1_ERROR: table … already exists`. To recover: stop dev,
  `rm -rf .alchemy/miniflare/v3/d1`, restart `bun dev` (alchemy auto-applies all pending migrations),
  then `bun run db:seed`.
- **D1 enforces foreign keys inside every migration** (each file runs as one transaction), so the
  `PRAGMA foreign_keys=OFF` in Drizzle's table rebuilds does nothing. Rebuilding a table that other
  tables reference fails or cascade-deletes child rows. Leaf tables are fine; for referenced tables
  follow `0021_blushing_stature.sql` (backup → drop children-first → recreate parents-first → copy
  back). `migrations.integration.test.ts` enforces this. Details: `reference/database.mdx`.
- Stopping `bun dev` uncleanly can leave `bun --watch … alchemy.run.ts` and Vite processes running,
  still bound to port 3001 and the same `.alchemy/miniflare` D1. A new `bun dev` then silently loses
  the port, and the browser keeps hitting old code with a stale D1 schema (every query fails after a
  table-rebuilding migration). Before starting dev or debugging local D1 errors, check
  `pgrep -af "alchemy.run.ts|vite-plus-core"` and stop anything not from the current session.

## Frontend conventions

- **Design system:** follow `DESIGN.md` (palette tokens, typography, radius scale, button sizes,
  section/tile/row patterns). Use theme tokens, never raw hex or Tailwind palette colors.

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
- **Prefetch what a route suspends on.** Every `useSuspenseQuery` reachable on first render must be
  primed in the route `loader` (`Promise.all` of `ensureQueryData`, keyed by `loaderDeps` for search
  params); otherwise each one suspends and fetches in sequence. Queries that depend on a user choice
  (e.g. a selected player) belong in a child component rendered only once the choice exists.
- **Detail procedures throw `NOT_FOUND`** (`requireFound`) instead of returning `undefined`, which
  React Query rejects; loaders turn it into `notFound()` with `orNotFound` (`@/lib/errors`).
- **UI language:** the public site is Portuguese; the admin dashboard (`/dashboard`, `/rating-update`)
  is English. Admin mutation errors go through `showMutationError` (English). Shared table controls
  (`DataTablePagination`, `Pagination`, search, filters) pick their language from the route via
  `useTableText`.
- **Admin page layout** (`components/admin/`): every page starts with `AdminPageHeader` (create and edit
  pages pass `backTo`/`backLabel`; edit pages put a `ConfirmDeleteButton` in `actions` when the record can
  be deleted). Forms use `EntityForm` with field definitions in `lib/admin-forms.ts`, or `AdminForm` +
  `FormSection` + `FormActions` when a form needs custom controls (players, posts, events, TV Sergipe);
  field errors use `FormField` with `error={fieldError(f, mutation.error)}`. Every collection is a
  `DataTable` (bordered frame from `Table`, paginated) with `DataTableRowActions` (pass `noun`); records that belong to a
  parent (links, circuit stages and podiums, rating results) are edited in the parent page with
  `EntityFormDialog`. Every delete or removal is confirmed in a dialog that names the record.
- **Default to zero comments.** Add a comment only when it explains a non-obvious "why" or a
  gotcha that a reader could not infer from the code itself. Never restate what the code does,
  never narrate intent that is obvious, and never leave explanatory/doc-style prose. If a comment
  merely re-describes the adjacent code, delete it. Reserve comments for invariants, timezone/SSR
  pitfalls, data-shape constraints, or a decision that contradicts what a reader would assume.

## Making a change

Worked examples live in `apps/fumadocs/content/docs/reference/recipes.mdx`; the rules to keep are in
`reference/invariants.mdx`. For every feature or fix:

1. **Schema:** edit `packages/db/src/schema`, run `bun run db:generate`, review the SQL, restart
   `bun dev`. Pick `ON DELETE` deliberately: `restrict` for history or results that must not vanish
   as a side effect.
2. **Procedure:** explicit `columns`, bounded `limit`, `requireFound`/`requireMutationRows`; writes
   use `adminProcedure`. Multi-statement writes go in one `db.batch` (D1 has no `BEGIN`). New
   public queries need a `PROCEDURE_CACHE_POLICY` entry; admin queries stay out of it.
3. **Invalidation:** update `ADMIN_QUERY_DEPENDENTS` when a mutation changes rows another router
   returns.
4. **Route/UI:** prefetch suspended queries in the `loader`; register new public routes in the
   sitemap, `check-ssr.ts`, and `e2e/a11y.e2e.ts` (admin pages in its dashboard list).
5. **Tests:** cover the change against D1 (`packages/api/src/*.integration.test.ts`), including the
   failure paths (`NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`).
6. **Docs:** update the procedure/route catalogs and any page or ADR the change contradicts.
7. **Verify:** `bun test`, `bun run check-types`, `bun run lint`; for routes or rendering also
   `bun run build && bun run check:ssr` and `bun run test:e2e`.

## Documentation

- **Fumadocs content (`apps/fumadocs/content/docs/`) is written in English** — titles,
  descriptions, and body text, including new pages and ADRs. Portuguese stays only in
  proper nouns and quoted UI strings or domain terms (e.g. route names like `/ratings`,
  labels such as "Sub 10", the federation's name). The web app's user-facing UI remains
  in Portuguese.

<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->
