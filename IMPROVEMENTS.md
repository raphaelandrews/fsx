# FSX Improvements

This is a task backlog based on a repository-wide review of the active application.
It covers the web app, TanStack Router/Start/Query integration, tRPC API, Better
Auth, Drizzle/D1 schema and migrations, Cloudflare handlers, UI, accessibility,
SEO, performance, maintainability, and Fumadocs.

The review included how the pieces operate together, not only isolated files.

## How to Use This File

- Tasks are numbered in implementation order. Work top to bottom; a later task may
  assume the earlier ones are finished.
- Status lives only in each task's checkboxes. A task is done when every box is
  checked; its heading then carries **(done)**. Do not keep a second status list.
- Completed tasks stay listed so the backlog records what has already been done.
- Every open item must end in a verifiable deliverable (a test, a script, a budget,
  a document, or a recorded decision). Items that only say "consider" or "do not"
  belong in *Decisions Already Made* instead.

## Decisions Already Made

- Do not rename `tournaments.date`.
- Keep `tv_sergipe` as the table name; it represents a fixed program in this project.
- Keep the current TanStack Router + React Query + tRPC + Cloudflare cache architecture.
- Do not replace working caching, prefetching, mutation invalidation, or SSR with a new abstraction without measurements.
- FSX is single-owner. A multi-admin role model stays deferred until a second administrator is needed.
- Anonymous public data is eventually consistent within the edge TTL. Do not add cache purging until a stale-content incident justifies it.
- Keep the two-step ratings query (page of IDs, then relations).
- Add indexes only to support filtering, ordering, or uniqueness — never because a column is frequently selected.
- Prefer small domain-specific helpers over a generic CRUD abstraction that hides authorization and validation. Rating updates and event-link reconciliation stay explicit.

## Priority Guide

- **Critical:** data corruption, authorization failure, or a production security issue.
- **Important:** correctness, data integrity, operational safety, or a likely production scalability problem.
- **Optional:** quality, maintainability, UX, accessibility, or optimization with lower immediate risk.

## Overview

| Phase | Tasks | Focus |
| --- | --- | --- |
| 0. Urgent fixes | 1–3 | Live bugs found in review |
| 1. Security and authorization | 4–11 | Trust boundaries |
| 2. Input and data integrity | 12–15 | Validation and database invariants |
| 3. Tests and error boundaries | 16–17 | Feedback before broad refactors |
| 4. Query and resource efficiency | 18–22 | Measure, then optimize |
| 5. Caching, SSR, and freshness | 23–28 | Explicit, measurable cache boundaries |
| 6. User experience and discoverability | 29–33 | Forms, accessibility, SEO |
| 7. Maintainability and operations | 34–40 | Code health, CI, recovery |
| 8. Documentation and LLM support | 41–44 | Docs after contracts stabilize |

---

## Phase 0: Urgent Fixes

Live bugs found during review. Fix these first; each needs a regression test.

### 1. Fix player rename in `players.update` — Critical (done)

**Why:** `const { id, name, ...rest } = input` removes `name`, and `.set()` writes only
`normalizedName`. Renaming a player updates the search column but leaves the
displayed name unchanged, so the two drift apart.

- [x] Write `name` together with `normalizedName` in `players.update`.
- [x] Add a `createCaller` test that renames a player and asserts both columns (`packages/api/src/admin-mutations.integration.test.ts`, real Miniflare D1; fails against the old code).
- [x] Add an audit query for rows where `normalized_name` no longer matches `name` (`packages/db/src/audits/player-names-and-urls.sql`, documented in `operacoes.mdx`).
- [x] Run the audit against production D1 (2026-10-02): no players with stale names.

### 2. Split URL validation into external URLs and media paths — Critical (done)

**Why:** Uploads return the relative path `/api/media/<kind>/<uuid>.<ext>`, but
`imageUrl` is validated with `urlText = z.string().url()`, which rejects relative
paths. Saving a player or post with an uploaded image fails with `BAD_REQUEST`.
The same validator accepts `javascript:` URLs, which end up in `href` attributes.

- [x] Add an `httpUrl` validator that accepts only `http:` and `https:` URLs.
- [x] Add a `mediaPath` validator matching `/api/media/(players|posts)/<uuid>.(jpg|png|webp)`, sharing the pattern with `urlToKey` (`MEDIA_PATH_PATTERN`/`MEDIA_KEY_PATTERN`).
- [x] Use `imageUrl` (`mediaPath` or `httpUrl`, since older rows may hold external images) for `players`, `posts`, and `cups`; use `httpUrl` for `chessResults`, `logoUrl`, `flagUrl`, and event/link `href`s.
- [x] Add tests: relative media path accepted, `javascript:`/`data:`/`mailto:` rejected, foreign media keys and traversal rejected, plus a `createCaller` round-trip.
- [x] Add an audit query for stored URLs the new validators would reject (`player-names-and-urls.sql`).
- [x] Run the URL audit against production D1 (2026-10-02). Literal `'null'` strings left by the migration in `tournaments.chess_results` were cleared to `NULL`. Only `cups.image_url` id 1 remains: the placeholder `"image"`. Cups have no dashboard editor, so nothing is blocked, but the Bullet page shows a broken image until a real URL is set.

### 3. Refresh admin views after admin edits — Important (done)

**Why:** After a player update, the edit page invalidated only `players.forEdit`.
`players.page`, `players.byId`, and `players.withFilters` stayed stale for the default
5-minute `staleTime`, so the dashboard list showed old data.

- [x] Invalidate the player query families through one shared helper (`useInvalidateAdmin` in `apps/web/src/lib/admin-mutations.ts`, which invalidates whole routers via `pathFilter()`).
- [x] Audit every dashboard route and admin component and route all mutations through `useInvalidateAdmin`. This fixed missing or partial invalidation in `locations/create`, `players/create`, the rating-update batch, link and insignia relations, and cross-domain views (club/title/location edits now refresh player lists). It also replaced `useInvalidateCircuit`.
- [x] Add an invalidation contract: `ADMIN_QUERY_DEPENDENTS` maps each mutated domain to the routers that embed it, type-checked against `AppRouter` and covered by `admin-mutations.test.ts`.
- [x] Create group links before invalidating in `links/create`, so the list no longer refreshes before the links exist.

---

## Phase 1: Security and Authorization

### 4. Make rating updates atomic and concurrency-safe — Critical (done)

**Why:** `playersTournament.linkWithRating` updated the player and inserted the
tournament history as separate operations. A partial failure could leave the rating
changed without an audit record, and concurrent updates could calculate from the
same old rating.

- [x] Wrap the player update and history insert in one D1 batch.
- [x] Read the current rating on the server; do not trust a client-supplied old rating.
- [x] Update only when the stored rating still equals the value used for the calculation; otherwise reject with `CONFLICT`.
- [x] Store the rating type on the player-tournament history row.
- [x] Add tests for success, failed history insertion, duplicate registration, and concurrent updates.

### 5. Define and enforce the administrator authorization model — Critical (done)

**Why:** `adminProcedure` must prove the session belongs to the owner, not only that a
session exists. The current check compares `user.name` (the GitHub login) with
`GITHUB_USERNAME`. GitHub logins can be renamed and later claimed by someone else,
who would then pass both the account-creation hook and `isAdministrator`.

- [x] Decide whether FSX is single-owner or multi-admin. It is single-owner.
- [x] Enforce the configured GitHub identity on every protected request, not only during account creation.
- [x] Return `FORBIDDEN` for authenticated users without the required permission.
- [x] Add focused authorization tests proving that a non-admin identity is rejected.
- [x] Bind the owner to the immutable GitHub numeric account ID (`GITHUB_USER_ID`, matched against `account.account_id`) in `requireAdmin`. Sign-in rejects every other GitHub ID inside `mapProfileToUser`, before any user, account, or session row is written; an account-hook `false` would still have created a user and a session. The rules live in `packages/auth/src/owner.ts`; the login and first-user rules remain only as fallbacks when no ID is configured.
- [x] Run only the lookup the active rule needs: the GitHub account row for the ID rule, nothing for the login rule, and the first-user query only when neither is configured.
- [x] Add tests for a renamed owner login and for a different account that reuses the old login (`owner.test.ts`, plus real-D1 `requireAdmin` checks in `admin-mutations.integration.test.ts`).
- [x] Set `GITHUB_USER_ID` in `apps/web/.env.common` (2026-10-02); Alchemy binds it to production on the next deploy.

### 6. Verify CSRF and session-cookie defenses — Critical (done)

**Why:** The API uses cookie-based authentication. Origin checks and cookie
attributes are a deliberate defense-in-depth boundary for every state-changing request.

- [x] Confirm Better Auth cookies are `HttpOnly`, `Secure` in production, and `SameSite=Lax`; `useSecureCookies` is explicit for HTTPS deployments.
- [x] Require a trusted `Origin` on tRPC/Auth POST handlers; requests without an `Origin` are accepted only by the explicit optional policy.
- [x] Verify OAuth callback and redirect URLs cannot be used for open redirects; the callback is the fixed relative `/dashboard`.
- [x] Test the cross-origin decision with focused origin tests; browser-level endpoint tests are part of deployment verification.
- [x] Document that sessions must rotate after any future privilege change and be invalidated on account removal.

### 7. Protect admin-only read procedures — Important (done)

- [x] Change `players.forEdit` to `adminProcedure`.
- [x] Audit procedures named `forEdit`, `options`, `listAdmin`, `backup`, `export`, or similar. `players.options` is admin-only; `swissManager.list` is intentionally public for the public export.
- [x] Return separate minimal public projections rather than reusing admin shapes.
- [x] Verify the public/admin boundary through authorization decision tests and procedure declarations.

### 8. Make event link reconciliation safe — Important (done)

- [x] Verify that `eventId` exists.
- [x] Require every supplied link ID to belong to the event's link group.
- [x] Scope update/delete predicates by both link ID and link-group ID.
- [x] Reject duplicate link types where the domain permits only one regulation, form, and result link.
- [x] Reconcile inserts, updates, and deletes in one transaction.
- [x] Add tests for cross-event link IDs and duplicate types.

### 9. Enforce one event link group per event — Important (done)

- [x] Add a unique index on `link_groups.event_id` (nullable directory groups remain distinct).
- [x] Check tracked migrations and seed definitions for duplicates before applying the migration.
- [x] Make the relation and API behavior reflect the one-to-one rule.

### 10. Harden image uploads — Important (done)

- [x] Restrict uploads to JPEG, PNG, and WebP.
- [x] Validate magic bytes instead of trusting only the MIME field.
- [x] Cap the base64 string before decoding and map malformed base64 to `BAD_REQUEST`.
- [x] Verify the decoded byte length against the limit.
- [x] Generate object keys exclusively on the server.
- [x] Add tests for malformed base64, MIME spoofing, SVG, oversized input, and valid images.

### 11. Harden public endpoints against cheap amplification — Important (done)

**Why:** Only POST requests are rate-limited. Anonymous GETs that miss the edge cache
(unknown procedures, or varied inputs such as `players.search`) reach D1 without any
limit. `sitemap.entries` is a public tRPC procedure with no cache-registry entry, so
every call returns up to 10,000 player IDs straight from D1. The rate limiter itself
performs one D1 write per checked request.

- [x] Remove `sitemap.entries` from the public `appRouter`; `/sitemap.xml` calls the server-only `getSitemapEntries()` (`packages/api/src/sitemap.ts`).
- [x] Rate-limit every tRPC GET that is not served from the edge cache (600/min per IP), including cookie-bearing GETs, because a forged session-cookie name bypasses the cache.
- [x] Evaluate the Workers Rate Limiting binding and record the decision (ADR 0005, `adr-rate-limiting.mdx`): the native `PUBLIC_READ_RATE_LIMIT` binding covers the uncached read path with no D1 write; auth and mutations keep exact D1 counters.
- [x] Return 404 instead of 500 for malformed media paths (`packages/api/src/media-handler.ts`).
- [x] Answer a matching `If-None-Match` on media with `304` through an R2 `etagDoesNotMatch` precondition, without transferring the body.
- [x] Add fetch-handler tests for each item above with real `Request`/`Response` objects and Miniflare D1/R2 (`fetch-handlers.integration.test.ts`). The tRPC and media handlers moved into `@fsx/api` (`trpc-handler.ts`, `media-handler.ts`) so they are testable; the route files only wire them.
- [x] Stop injecting stored `links.icon` SVG into `/links`. The icons now live in one shared allowlist (`packages/api/src/link-icons.ts`), writes of any other markup are rejected, and the page renders through `resolveLinkIcon`. Legacy custom icons render as the default link icon and are replaced with it on the next save.

---

## Phase 2: Input and Data Integrity

### 12. Bound and validate API inputs — Important

**Why:** Unbounded or loosely typed inputs consume D1 reads and CPU, and malformed
values silently produce wrong results.

- [x] Add positive integer and maximum constraints to `page`, `limit`, IDs, ratings, points, and sort orders.
- [x] Cap search strings and content fields at domain-appropriate lengths.
- [x] Cap filter-array sizes for clubs, locations, titles, and groups.
- [x] Reject invalid pages rather than allowing huge offsets.
- [x] Apply the same constraints to admin procedures.
- [x] Add tests for negative values, fractional values, huge limits, and oversized arrays.
- [x] Reject blank names on update: `tournaments.update.name`, `posts.update.title`, and `posts.update.slug` used search-text rules that allowed empty strings.
- [x] Validate `groups` filters as an enum of known age groups (`AGE_GROUPS` in `packages/api/src/age-groups.ts`, shared with the ratings page options). `/ratings` drops unknown `grupo` values from the URL instead of sending them to the API.
- [x] Validate `birthDate` as an ISO `YYYY-MM-DD` date (`isoDate`), along with the date-picker-backed `tournaments.date` and `events.startDate`. The rating import converts `DD/MM/YYYY` spreadsheet text (`toIsoDate`).
- [x] Escape `%`, `_`, and `\` in every user-supplied `LIKE` pattern (`escapeLike` + `like(... ESCAPE '\')` in `packages/api/src/sql-like.ts`): `players.search`, `players.page`, `players.withFilters`, `clubs.search`, `tournaments.search`.
- [x] Validate numeric `$id` params in every dashboard and public route with `params.parse` (`idParams` in `apps/web/src/lib/route-params.ts`); malformed IDs throw `notFound()` instead of reaching the API.
- [x] Add tests: age-group mapping, ISO dates, `LIKE` escaping, `idParams`, and real-D1 checks that `_`/`%` match literally, `sub-10` filters by birth date, and unknown groups or `DD/MM/YYYY` birth dates are rejected.
- [x] Add an audit for stored non-ISO dates (`packages/db/src/audits/date-formats.sql`, documented in `operacoes.mdx`).
- [x] Run the date audit against production D1 (2026-10-02): no non-ISO dates.
- [ ] Split `pre-migration-data-checks.sql` (50 terms) and `timestamp-format.sql` (33 terms) into compound SELECTs of at most 5 terms; production D1 rejects larger ones with `too many terms in compound SELECT`.

### 13. Move rate-limit state into migrations — Important (done)

- [x] Add `rate_limits` to the Drizzle schema and generate the migration through the normal workflow.
- [x] Apply the migration through the Alchemy/D1 workflow.
- [x] Remove runtime `CREATE TABLE IF NOT EXISTS` initialization.
- [x] Clean up expired rows with a scheduled job (`fsx-rate-limit-cleanup`, every 15 minutes).
- [x] Add metrics for rate-limit failures and table growth.

### 14. Add database-level domain constraints — Important (done)

- [x] Add SQLite `CHECK` constraints for stable finite domains (sex, rating type, event type, location type, role type, bracket type).
- [x] Keep Zod validation at the API boundary for useful error messages.
- [x] Add checks for non-negative ratings, points, prize values, and valid placement ranges.
- [x] Audit existing rows before applying constraints (`packages/db/src/audits/pre-migration-data-checks.sql`).

### 15. Make timestamp invariants explicit — Important (done)

- [x] Make `created_at` and `updated_at` `NOT NULL` in domain tables.
- [x] Store all timestamps in one documented UTC format.
- [x] Document that direct SQL writers must set `updated_at`; Drizzle `$onUpdate()` only covers ORM writes.
- [x] Include `updatedAt` in article queries and use it for SEO `modifiedTime`.

---

## Phase 3: Tests and Error Boundaries

Finish these before the broad refactors in Phases 4–7 so later changes have reliable feedback.

### 16. Complete the layered automated test suite — Important (done)

**Why:** The suite had unit, `createCaller`, and real-Miniflare D1 layers, but only
~36 tests. Both Phase 0 bugs sat in create/update paths that no test exercised.

**Bugs the new layers found and fixed:**
- `events.setLinks` used `db.transaction()`, which D1 rejects (`BEGIN` is unsupported), so every dashboard event edit failed in production. It now reads first, then applies all writes in one atomic `db.batch()`.
- Missing players, posts, announcements, circuits, tournaments, and cups made SSR return 500, because detail procedures returned `undefined`, which React Query rejects. They now throw `NOT_FOUND` (`requireFound`), and loaders render a 404.
- Unknown URLs rendered the not-found page with status 200; the catch-all route now throws `notFound()` and returns 404.
- `/ratings` (and the default-page news, announcements, and TV Sergipe lists) 307-redirected to URLs full of default search params; `stripSearchParams` keeps defaults out of the URL.

- [x] Use `bun:test` for pure functions, schema helpers, normalization, authorization decisions, cache classification, mutation-result checks, and error mapping.
- [x] Use tRPC `createCaller` with a typed fake context for procedure tests.
- [x] Use a real Miniflare D1 database for migration and integration tests, applying migrations before each isolated suite.
- [x] Test critical database workflows against real D1: rating transactions, unique constraints, cascades, and rollback.
- [x] Test auth middleware/admin authorization, rating invariants, event link ownership, and image validation.
- [x] Test migration application against a clean local D1 database.
- [x] Keep unit tests deterministic, with no external GitHub, Cloudflare, or network calls.
- [x] Add a create → read → update → read → delete round-trip for every admin router against real D1, with realistic inputs including media paths (`admin-crud.integration.test.ts`), plus player relations and `events.setLinks`.
- [x] Test every update/delete/unlink mutation with a missing id (`NOT_FOUND`) and an invalid id (`BAD_REQUEST`): 43 procedures.
- [x] Test the tRPC fetch handler with real `Request`/`Response` objects: origin checks, cache headers and hits, rate limits, batching (including mixed public/admin batches), signed owner/impostor/forged session cookies over HTTP, and authenticated mutations (`fetch-handlers.integration.test.ts`).
- [x] Test SSR of the built worker for status codes, titles, canonical URLs, not-found behavior, auth redirects, the sitemap, and absence of stack traces/SQL in HTML (`bun run check:ssr`, `apps/web/scripts/check-ssr.ts`, run in CI after the build).
- [x] Add browser-level tests only where a browser is required (Playwright, `apps/web/e2e/`, `bun run test:e2e`): OAuth redirect to GitHub (intercepted), session-gated dashboard, form validation and success toasts, create/edit/delete with an Escape-cancellable confirm dialog, the keyboard command menu, the player sheet, and a real image upload through the cropper. They run against the built worker plus static assets in Miniflare (`scripts/e2e-server.ts`, shared `scripts/worker-harness.ts`); admin specs use a signed owner session cookie seeded in the local D1, so the app has no test-only login path.
- [x] Add an accessibility smoke pass with axe (`e2e/a11y.e2e.ts`) on public pages, the command menu dialog, and dashboard list/form/player pages; serious and critical WCAG 2.1 AA violations fail CI. Fixes it required: darker `--primary` (`oklch(0.61→0.57 …)`, white-on-primary 4.06→4.5+:1) and `--link` (`oklch(0.609→0.55 …)`, 3.63→4.5+:1) light-theme tokens, accessible names on both logo links and all 11 select triggers, and a label for the native sex select.
- [x] Run the browser suite in CI after the build (Chromium installed per run; failure traces uploaded as an artifact).

### 17. Standardize the backend error boundary — Important (done)

Merges the former backend error tasks.

- [x] Use `TRPCError` with `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `FORBIDDEN`, and `INTERNAL_SERVER_ERROR` consistently; no plain `Error` in expected paths.
- [x] Define stable categories: validation, unauthorized, forbidden, not found, conflict, rate limited, unexpected failure.
- [x] Add an `errorFormatter` that exposes field-level Zod errors without internals.
- [x] Check returned rows for update/delete and throw `NOT_FOUND` across active CRUD mutations.
- [x] Map unique-constraint failures to `CONFLICT`.
- [x] Wrap unexpected errors with a generic message, preserve the original as `cause`, and log once with procedure name and request ID.
- [x] Ensure production responses never include SQL, stack traces, secrets, storage keys, or provider details.

---

## Phase 4: Query and Resource Efficiency

Measure before optimizing. Task 16 should exist before query shapes change.

### 18. Add resource and response-size regression coverage — Important (done)

- [x] Assert the public cache classification for anonymous GETs and authenticated/mutation exclusions.
- [x] Log response sizes and slow procedures (≥100 ms), and warn above the 512 KB public response budget.
- [x] Assert maximum sizes on production-like data: `check:ssr` now renders every data-heavy public page on synthetic rows matching production counts and fails above per-route HTML budgets (~1.5× the 2026-10-02 size); `bun run measure` reports procedure response sizes against the 512 KB budget.
- [x] Assert that mutations never receive cache headers and that failed queries are not cached (fetch-handler tests).
- [x] Record D1 query count per procedure in production logs (`meterD1` in the request context; `[trpc] costly procedure` logs procedures ≥100 ms or ≥8 queries). Worker CPU time comes from Workers observability; cache hit/miss is already logged.
- [x] Add `bun run measure` (`packages/api/scripts/measure.ts`): seeds deterministic synthetic data (`synthetic-data.ts`) and reports D1 queries, replayed `rows_read`, response KB, duration, and real-table scans for 31 representative public and admin procedures.
- [x] Add an API-requests-per-navigation budget (`e2e/requests.e2e.ts`).
- [x] Add initial HTML size budgets to `check:ssr` (largest today: `/tv-sergipe` 164 KB, `/circuitos` 150 KB, `/ratings` 139 KB uncompressed).
- [x] Test that SSR hydration does not refetch, hover prefetch is reused on click, navigations stay within 2 API requests, and public pages never call admin procedures (`e2e/requests.e2e.ts`).

### 19. Bound large public query responses — Important (done)

**Why:** `players.list`, `swissManager.list`, `roles.listWithPlayers`, and the nested
`circuits.list` grow with the data set.

- [x] Keep explicit column projections on public queries (latest: `insignias.list`, `norms.list`, `roles.listWithPlayers`).
- [x] Add response-size monitoring for the largest procedures.
- [x] Measure row counts and response sizes on production-like data (`row-counts.sql` → `packages/api/scripts/production-counts.json`, plus `growth-counts.json` at 3×). Results: [Query Cost Baseline](apps/fumadocs/content/docs/query-cost-baseline.mdx).
- [x] Remove the unused public `players.list` (500 players with nested relations) and `circuits.list` (duplicate of `listSimple`); the circuit summary/detail split already exists as `listSimple` + `byId`.
- [x] Fix the Swiss Manager export, which Task 7's `PUBLIC_COLLECTION_LIMIT` silently truncated to the 500 highest-rated players.
- [x] Stop sending every post's content to the dashboard: `posts.listAdmin` projects list columns (≈937 → 55 KB at 300 posts) and the post editor loads one row through `posts.forEdit`; announcement and tournament editors load by id too.
- [x] Make truncation visible instead of silent: the procedure middleware logs `[resource] collection reached its row cap` whenever a list returns `PUBLIC_COLLECTION_LIMIT` rows. No public collection is near the cap today (largest: 182 clubs); pagination is not needed yet.
- [x] Replace the admin player picker (`players.options`, 218 KB, truncated at 5,000 of 5,384 players) with server-side search through `SearchableSelect`.
- [x] Split summary and detail procedures where a route does not need the full nested graph (circuits already use `listSimple` + `byId`; the duplicate `circuits.list` was removed).

### 20. Measure query plans and procedure costs — Important (done)

- [x] Capture the slowest and most query-heavy procedures in production logs (`[trpc] costly procedure` with duration and D1 query count).
- [x] Run `EXPLAIN QUERY PLAN` on every statement of 30 representative procedures at production volume (`bun run measure`); only small tables (`posts`, `roles`, `tournaments`) and infix-`LIKE` player search scan.
- [x] Confirm composite indexes match the `WHERE` + `ORDER BY` patterns and record the results (Query Cost Baseline). `titledPlayers.list` was rewritten from `EXISTS` to `IN (subquery)`: 6,128 → 1,042 rows read.
- [x] Recheck write cost and D1 storage after any index change: no index was added or removed.

### 21. Optimize high-value query shapes — Optional (done)

Depends on Task 20's measurements.

- [x] Measure the ratings count query: ~2,400 rows per uncached request; kept, because the pagination UI shows exact totals and responses are edge-cached.
- [x] Evaluate keyset pagination: page 50 reads ~4,450 rows vs ~2,500 for page 1; offset kept at this volume.
- [x] Evaluate longer TTLs for lookup lists: they read 11–182 rows, so a longer TTL saves little and lengthens anonymous staleness; kept at 300 s per ADR 0003.
- [x] Ensure every list procedure has deterministic ordering with a stable ID tie-breaker (announcements, player search, circuit podiums, event/link-group links, admin posts; circuit phases had no order at all).
- [x] Remove fields from public projections that no route renders (`tvSergipe.list` no longer ships club logo URLs; `posts.listAdmin` no longer ships post bodies).

### 22. Remove data-fetching waterfalls in admin routes — Important (done)

**Why:** `dashboard/players/$id.tsx` calls `useSuspenseQuery` ten times in one
component, but its loader prefetches only five. `forEdit` and the three
`listByPlayer` queries therefore suspend and fetch one after another.

- [x] Prefetch every query a route suspends on in its loader with `Promise.all`.
- [x] Fix `players/$id.tsx` and `players/titles.tsx` (which also crashed with `BAD_REQUEST` when opened without `?playerId`; the selection now lives in the URL), then audit every route: all others prefetch what they suspend on.
- [x] Record the rule as a convention in `AGENTS.md` (a lint rule cannot match loader prefetches to queries in shared components).

---

## Phase 5: Caching, SSR, and Public Freshness

Keep the existing architecture, but make its boundaries explicit and measurable.

**Current model (keep):** route loaders prefetch before render; `loaderDeps` drives
filter routes; React Query reuses data and invalidates after mutations; SSR calls tRPC
in-process; anonymous public GETs use bounded Cache API entries; authenticated
requests bypass the edge cache; stable pages are prerendered. React Query
invalidation does not purge cached anonymous edge responses, so anonymous users may
see old data until the TTL expires.

### 23. Centralize cache policy — Important

- [x] Keep one registry for procedure cache TTLs.
- [x] Classify procedures as public-cacheable, private, or never-cache.
- [x] Cache only successful anonymous queries; never cache mutations, errors, or authenticated output.
- [x] Test batched requests containing a private or unknown procedure.
- [x] Confirm cookie detection covers every Better Auth cookie variant used in production.
- [x] Set TanStack Router `defaultPreloadStaleTime` to `0` so React Query is the single client-side freshness authority.
- [ ] Add a test that every public `query` procedure has an explicit registry entry, so new procedures cannot silently become uncached.
- [ ] Document that `caches.default` is per-data-center, not globally replicated, and validate the tradeoff with cache-hit and latency measurements.

### 24. Make the tRPC edge-cache path cheaper — Optional

**Why:** The handler awaits `cache.put`/`cache.delete` before responding, buffers the
full body of every successful GET even when it cannot be cached, and sends the
internal `x-cache-fetched-at` header to clients.

- [ ] Run `cache.put` and `cache.delete` through `waitUntil` instead of awaiting them on the response path.
- [ ] Clone and parse the body only when the response is cacheable or size telemetry needs it.
- [ ] Keep `x-cache-fetched-at` only on the stored entry, not on the client response.

### 25. Decide on caching for SSR public HTML — Important

**Why:** SSR calls tRPC in-process, so the edge cache only helps client-side
navigation. Every anonymous page view (home, ratings, news, players) renders on the
Worker and queries D1. No task covered this before.

- [ ] Measure D1 queries and CPU time per anonymous SSR page view for the top routes.
- [ ] Evaluate the options and record the decision: short-TTL Cache API entries for anonymous HTML, routing SSR reads through the same edge-cached procedure results, or accepting the cost.
- [ ] If HTML is cached, ensure cookie-bearing requests bypass it and `Vary`/cache keys include the search params that change content.

### 26. Coordinate invalidation with public freshness — Important

Merges the former invalidation and dashboard-freshness tasks.

- [x] Document the anonymous consistency window after admin mutations.
- [x] Invalidate only the affected React Query families after successful mutations, including related lists and details visible in multiple dashboard routes.
- [x] Do not invalidate every query globally after ordinary CRUD edits.
- [x] Treat the public edge TTL as the normal propagation window.
- [ ] Add an admin "purge public cache" action for operational recovery only (the `dashboard/cache` route is the place), and a versioned cache key if immediate global freshness becomes a requirement.
- [ ] Add end-to-end checks for immediate dashboard freshness and eventual anonymous freshness.

### 27. Keep prefetching intentional — Optional

- [x] Retain intent prefetching for likely navigation targets.
- [x] Avoid prefetching large nested queries on every hover or focus.
- [x] Use route-specific stale times for stable lookup data and frequently edited content.
- [x] Prefetch the current route's critical data and a few likely next destinations, not every public page.
- [ ] Verify that preload requests do not duplicate SSR work for the same navigation.
- [ ] Measure cache-hit rate and request volume before widening preload scope.
- [ ] Prefer prefetching lookup data and the next paginated result over full nested graphs.
- [ ] Add a per-navigation prefetch request budget (enforced in Task 18).

### 28. Review prerender boundaries and the sitemap — Optional

- [x] Prerender only stable, public, SEO-important pages (`/sobre`, `/normas-tecnicas`).
- [x] Do not prerender admin pages or frequently changing content.
- [x] Generate the sitemap dynamically with published news and active player URLs.
- [ ] Cache `/sitemap.xml` in the Cache API; `s-maxage` alone does not cache Worker-generated responses.
- [ ] Add a check that every new public route is either in the sitemap or explicitly excluded (extend `check:routes`).
- [ ] Test prerendered HTML for metadata, canonical URLs, and hydrated data (`check:seo` covers part of this).

---

## Phase 6: User Experience and Discoverability

These depend on the error taxonomy (Task 17) and resource boundaries being stable.

### 29. Frontend error handling and form feedback — Important

Merges the former frontend error-boundary, form-feedback, and duplicated loading-state items.

- [x] Add one client error-mapping function that converts tRPC codes and Zod field errors into safe Portuguese messages.
- [x] Never display raw server error messages by default.
- [x] Show `UNAUTHORIZED` as a sign-in action and `FORBIDDEN` as access denied.
- [x] Show `NOT_FOUND` as a route-appropriate not-found state.
- [x] Show `TOO_MANY_REQUESTS` with a retry-after message and no automatic retry.
- [x] Reserve global query toasts for unexpected background failures.
- [x] Add a visible retry action that invalidates the relevant query.
- [ ] Use `getUserErrorMessage` in every admin mutation `onError` instead of hard-coded strings.
- [ ] Translate the remaining English admin toasts ("Player updated", "Failed to update player", …) to Portuguese.
- [ ] Show field-level validation errors next to the relevant form controls.
- [ ] Show conflict errors with a reload/retry action, especially for rating and concurrent edits.
- [ ] Disable submit controls and prevent duplicate submissions while mutations are pending.
- [ ] Preserve entered values when a mutation fails.
- [ ] Confirm destructive operations consistently, especially bulk deletes.
- [ ] Add tests for each error category and its rendered message (mapping tests exist; rendered form coverage remains).

### 30. Fix upload accessibility — Optional (done)

- [x] Replace the clickable upload `<div>` with a semantic, labelled control.
- [x] Make upload, replace, and remove controls keyboard reachable.
- [x] Expose actions on focus and touch, not only hover.
- [x] Add accessible status text for reading, cropping, uploading, success, and failure.
- [x] Connect a visible label or description to the file input.

### 31. Improve navigation and responsive behavior — Optional

- [ ] Verify that every icon-only button has an accessible name. Pages covered by `e2e/a11y.e2e.ts` pass; extend the axe page list to the remaining dashboard routes.
- [ ] Ensure dialogs, sheets, command menus, and dropdowns have visible focus states and predictable Escape behavior.
- [ ] Test admin tables at 375 px width; provide horizontal scrolling or card layouts where needed.
- [ ] Announce pagination page changes and preserve focus.
- [ ] Provide non-hover alternatives for important actions.
- [ ] Verify WCAG AA color contrast in light and dark themes. Light theme passes on the axe-covered pages after the token change; dark theme is untested (run the axe pages with `colorScheme: "dark"`).
- [ ] Make controls usable before hydration finishes. The e2e specs must wait for `networkidle` because buttons such as the row-action menu and the `/` command-menu shortcut do nothing until React hydrates; on slow phones real users hit the same dead window.

### 32. Improve loading and empty states — Optional

- [ ] Make route skeletons match final layout dimensions to reduce layout shift (measure CLS).
- [ ] Give empty admin collections an empty state with the next action.

### 33. Improve content and SEO quality — Optional

- [x] Use `updatedAt` for article modification metadata.
- [ ] Confirm every public route has a unique title and description (extend `check:seo`).
- [ ] Strip Markdown syntax before truncating post content into meta descriptions.
- [ ] Add structured data only where it accurately describes the rendered content.
- [ ] Verify image dimensions, alt text, and lazy loading on content-heavy pages.
- [ ] Check canonical URLs for paginated and filtered routes (ratings, news).

---

## Phase 7: Maintainability and Operations

### 34. Reduce duplicated mutation and invalidation code — Optional

- [ ] Identify repeated CRUD route patterns and extract only genuinely shared behavior.
- [ ] Standardize mutation success/error/invalidation handling in admin pages where behavior is identical (build on `invalidateAdminQueries` and Task 29's error mapping).
- [ ] Keep a mutation → invalidated query families map in one place, covered by a test (see Task 3).

### 35. Keep active linting clean — Optional (done)

- [x] Remove deleted legacy-tree assumptions from the lint and documentation workflow.
- [x] Remove active warnings such as the unused `z` import in `packages/env/src/web.ts`.
- [x] Keep warnings in active `apps/` and `packages/` code visible in CI.

### 36. Document architectural contracts — Optional (done)

- [x] Document the package dependency direction: web → API → auth → DB → env, with UI as a shared presentation package.
- [x] Document which procedures are public, protected, and administrator-only.
- [x] Document cache TTLs, invalidation, and the anonymous edge-cache consistency window.
- [x] Document D1 migration rules and the local Alchemy migration tracker workflow.
- [x] Record important decisions as ADRs (`apps/fumadocs/content/docs/adr-*.mdx`).

### 37. Add privacy and data-governance rules — Important (done)

- [x] Inventory personal data in player profiles, authentication records, logs, backups, and exports.
- [x] Document which player fields are public and which are administrative.
- [x] Define who can edit or delete identity, rating, and profile data.
- [x] Define retention and deletion for Better Auth sessions and stale accounts.
- [x] Ensure error logs and analytics do not include unnecessary personal data.
- [x] Add a process for correcting inaccurate player data and preserving the rating audit trail.

### 38. Protect backup and export workflows — Important

- [x] Require administrator authorization for backup and export procedures.
- [x] Add `Cache-Control: no-store` to sensitive download responses.
- [x] Avoid logging exported data, secret-bearing URLs, or full request payloads.
- [x] Define retention and deletion rules for downloaded backups.
- [x] Audit backup/export access with administrator, timestamp, procedure, and result.
- [x] Protect CSV/spreadsheet exports against formula injection.
- [ ] Verify a production backup restores successfully (`bun run db:backup:verify` against a staging D1).

### 39. Establish recovery and deployment safeguards — Important

- [x] Document the rollback procedure for application and database migrations.
- [x] Keep migration application and deployment ordering explicit.
- [x] Document restore verification and add a deploy smoke test (`scripts/deploy-smoke-test.sh`).
- [x] Schedule rate-limit cleanup and document orphaned R2 object discovery and cleanup.
- [ ] Run a production restore exercise on a schedule and record the date of the last successful one.
- [ ] Add alerts for failed deployments, migration failures, elevated 5xx rates, and rate-limit spikes.

### 40. CI quality gates and dependency hygiene — Important

- [x] Run tests, type checking, linting, and build in CI.
- [x] Fail CI when generated migrations differ from the schema, and check the generated route tree (`check:routes`).
- [x] Run `bun audit --audit-level=high`.
- [x] Enforce bundle-size budgets for the largest client chunks (`check:bundle`: Excel export, rating update, player profile).
- [ ] Confirm devtools are excluded from production output; `__root.tsx` imports them statically and only gates rendering on `import.meta.env.DEV`. Use a lazy dev-only import and assert their absence in `check:bundle`.
- [ ] Review transitive packages in the Worker bundle.
- [ ] Pin Cloudflare runtime, Miniflare, Alchemy, and D1-related versions together, with a documented upgrade procedure (see the Miniflare version gotcha in `AGENTS.md`).

---

## Phase 8: Documentation and LLM Support

Document behavior after the architecture and operational contracts stabilize;
otherwise the docs go stale immediately.

### 41. Organize Fumadocs by audience — Optional

Fumadocs content is written in English (rule in `AGENTS.md`).

- [ ] Translate the remaining Portuguese pages to English: `index` (Normas Técnicas), `inicio`, `bullet`, `campeoes`, `circuitos`, `comunicados`, `copas`, `jogadores`, `jogos-escolares`, `membros`, `painel-administrativo`, `rating`, `renderizacao-e-cache`, `sobre`, `titulacoes`, `titulados`, `variacao-rating`. Consider English file slugs at the same time, with redirects if the docs are already linked externally.
- [ ] Keep a domain guide for federation staff and users.
- [ ] Add an architecture guide for maintainers.
- [ ] Add an API and database reference for developers and LLMs.
- [ ] Add operational runbooks for local development, migrations, backups, deployment, and incident recovery.
- [ ] Add a glossary of domain terms and abbreviations.

### 42. Document the domain model — Optional

- [ ] Explain players, clubs, locations, titles, roles, norms, insignias, tournaments, circuits, cups, announcements, and events.
- [ ] Document relationships and deletion behavior with a schema diagram.
- [ ] Explain rating types and rating-history invariants.
- [ ] Explain school leaderboard scoring and medal weighting.
- [ ] Explain what is public and what is administrative.

### 43. Document runtime behavior — Optional

- [ ] Explain the request lifecycle from route loader to React Query, tRPC, Drizzle, and D1.
- [ ] Explain SSR, hydration, route preloading, and prerendering (including the Task 25 decision).
- [ ] Explain public edge caching versus authenticated requests.
- [ ] Explain image upload, R2 storage, URL format, replacement, and cleanup.
- [ ] Explain authentication, the owner identity binding, and future authorization boundaries.

### 44. Add LLM-friendly references — Optional

- [ ] Create a procedure catalog with purpose, access level, input shape, output shape, cache policy, and common errors.
- [ ] Create a route catalog with URL, purpose, data dependencies, and SEO behavior.
- [ ] List invariants and forbidden states explicitly.
- [ ] Add examples for common tasks: adding a field, a procedure, and a public route.
- [ ] Keep examples short, deterministic, and synchronized with tests where possible.

---

## Verification Checklist

Run before marking a phase complete.

- [x] `bun test`
- [x] `bun run check-types`
- [x] `bun run lint`
- [x] `bun run build`
- [x] `bun run check:bundle`, `check:seo`, `check:routes`
- [x] Database migrations apply cleanly to a fresh local D1 database.
- [x] Admin procedures reject unauthenticated and unauthorized callers.
- [x] Rating updates remain consistent after simulated failures.
- [x] Event link reconciliation cannot cross event boundaries.
- [x] Upload validation rejects malformed and unsupported files.
- [x] Player and post create/update round-trips succeed, including uploaded images (Tasks 1–2).
- [ ] Public routes render correct SSR HTML, status codes, and metadata.
- [ ] Keyboard-only navigation works for dialogs, command menu, forms, tables, and uploads.
