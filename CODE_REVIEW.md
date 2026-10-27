# Code review

## Summary

<!-- Filled in Phase 4. -->

## Phase 1: Bugs, security and database

Scope: `packages/api`, `packages/db`, `packages/auth`, `packages/infra` and the server side of `apps/web` (`src/server`, `src/routes/api`, auth guards, the rating-import hook). Read-only; no source file was changed.

### Baseline

| Gate | Result |
| ---- | ------ |
| `bun run check-types` | Pass (6 packages) |
| `bun run lint` | Pass, no warnings |
| `bun test` | 517 pass, 0 fail, 83 files |

The "procedure rejected" and "rate limit exceeded" lines in the test output are expected `console.warn` calls from the failure-path tests, not failures.

Findings marked **Verified** were reproduced against a Miniflare D1 with a scratch test kept outside the repo (`<scratchpad>/probe*.test.ts`). The rest were verified by reading the code.

Progress is tracked with `[x]` (fixed) and `[ ]` (open) on each finding heading.

Counts: 0 Critical, 1 High, 7 Medium, 12 Low, 5 Nitpick.

---

### High

#### [x] H1. A tRPC batch request counts as one rate-limit hit, and batch size is unlimited

> **Status:** Fixed: `MAX_BATCH_SIZE = 10` on server and client, with a test.

- **Severity**: High
- **Location**: `packages/api/src/http/trpc-handler.ts:51-56` (`fetchRequestHandler` has no `maxBatchSize`), `:67` (POST limiter), `:109` (GET limiter); client side `apps/web/src/router.tsx:56` (`httpBatchLink` with no `maxItems`)
- **Problem**: tRPC 11.18 defaults `maxBatchSize` to unlimited (`unstable-core-do-not-import.d.mts:848-850`). The limiters count HTTP requests, not procedures. A single anonymous `GET /api/trpc/players.compare,players.compare,…?batch=1&input=…` of about 16 KB carries hundreds of calls. Each call is a separate uncached D1 workload (`players.compare` loads two full careers; `players.season`, `players.stats` and `records.*` are similar). The edge cache cannot help, because every distinct batch URL is a distinct key, and a miss is billed as one of the 600 reads per minute per IP. The documented ceiling of 600 reads/min is therefore really 600 requests × N procedures. POST batches of mutations are bounded only by Origin, and `playerRequests.submit` is public.
- **Fix**: cap the batch on the server and on the client, and keep the two in step.
  ```ts
  // trpc-handler.ts
  fetchRequestHandler({ req: request, router: appRouter, createContext, endpoint: "/api/trpc", maxBatchSize: 10 });
  // router.tsx
  httpBatchLink({ url: "/api/trpc", maxItems: 10 })
  ```
  Optionally charge the limiter once per procedure (`pathname.split(",").length`).

---

### Medium

#### [x] M1. D1's 100-bound-parameter limit breaks bulk actions and `players.withFilters` at their documented maximums

> **Status:** Fixed: `MAX_BULK_IDS` and `limit` capped at 90, with boundary tests.

- **Severity**: Medium. **Verified.**
- **Location**:
  - `packages/api/src/input-schemas.ts:40-42` (`MAX_BULK_IDS = 200`, `bulkIds`)
  - `packages/api/src/routers/players.ts:181,195` (`bulkSetActive`, `bulkSetClub`)
  - `packages/api/src/routers/tournament-podiums.ts:58,95` (`assertManual`, `bulkDelete`)
  - `packages/api/src/services/change-log.ts:75,89,106`
  - `packages/api/src/input-schemas.ts:16` (`limit` max 100) → `packages/api/src/routers/players.ts:489` → `packages/api/src/gamification/ranking.ts:50-54` (`movementsFor`)
- **Problem**: D1 allows at most 100 bound parameters per statement (`reference/database.mdx` notes "bound parameters per statement are limited" without the number). `bulkIds` accepts 200 ids, so `bulkSetActive` with 100 ids (1 for `active` plus 100) already fails. Measured: 99 ids run, 200 ids return `INTERNAL_SERVER_ERROR`, and the change-log read for the same call fails too. Separately, `players.withFilters` accepts `limit` up to 100. `movementsFor` binds 1 (rating type) + 2 (snapshot times) + up to 100 player ids. Measured with 100 active players and two snapshots: `limit` 20 and 90 succeed, `limit` 100 returns a 500 to an anonymous caller. The UI does not hit either today (admin pages are ≤50 rows, the public page uses the default 20), so this is a latent contract bug. It will surface as soon as someone raises a page size or calls the API directly.
- **Fix**: set the caps from the real limit and add a test at the boundary.
  ```ts
  export const MAX_BULK_IDS = 90;               // 100 params − room for SET values
  export const limit = positiveInt.max(90).default(20);
  ```
  Or chunk: `for (const part of chunk(ids, 90)) …` inside one `db.batch`.

#### [x] M2. The change log silently drops entries for any action touching more than about 14 rows

> **Status:** Fixed: change-log inserts chunked at 12 rows, with a 30-record test.

- **Severity**: Medium. **Verified.**
- **Location**: `packages/api/src/services/change-log.ts:168` (`db.insert(changeLog).values(rows)`), error swallowed at `packages/api/src/index.ts:252-257`
- **Problem**: `change_log` has 7 bound columns per row, so a multi-row insert fails past 14 rows (100 ÷ 7). The middleware catches the error and only calls `console.error`. Measured: after creating 30 players, `bulkSetActive` on 10 ids wrote 10 log rows; the same call on 20 ids wrote none. The administrator got a success toast. Bulk edits are exactly the actions the log exists to reconstruct, and `tournamentPodiums.createMany` / `bulkDelete` have the same shape. The doc for the feature says failures to record "never block what the administrator did". That trade-off is fine, but here it fails for normal-sized inputs, not for rare faults.
- **Fix**: insert in chunks of 12 rows inside the same `db.batch`.
  ```ts
  const inserts = chunk(rows, 12).map((part) => db.insert(changeLog).values(part));
  await db.batch([...inserts, db.delete(changeLog).where(…)]);
  ```
  Add a test with 20 ids.

#### [x] M3. Anonymous update-request caps are racy and cheap to exhaust

> **Status:** Fixed (caps): the insert re-checks all three caps in one statement; a parallel-submit test now stores exactly 3. **Still open (configuration):** set `TURNSTILE_SECRET_KEY` in production.

- **Severity**: Medium. **Verified.**
- **Location**: `packages/api/src/routers/player-requests.ts:71-130` (`submit`), `packages/api/src/http/turnstile.ts:6-8`, `packages/infra/alchemy.run.ts:91` (Turnstile secret bound only if set)
- **Problem**:
  1. The three caps (3 per player, 300 pending, 100 photos) are read in one batch and the insert happens afterwards in a separate round trip. Measured: 12 parallel `submit` calls for one player, all 12 inserted (cap is 3). Parallel callers also bypass the 300 and 100 totals.
  2. The only gate in front of the public form is the per-IP mutation limit (300/min), the honeypot field `website`, and Turnstile, which is off whenever `TURNSTILE_SECRET_KEY` is unset. A script can fill the 300 pending slots in a minute. That locks every legitimate visitor out of the form (`TOO_MANY_REQUESTS`) until an administrator clears them one by one, and it parks up to 100 × 2 MB of photos in R2 for 30 days.
- **Fix**: make the cap part of the insert so the check and the write are one statement, and make Turnstile mandatory in production.
  ```ts
  db.insert(playerUpdateRequests).select(
    db.select({ … }).from(sql`(SELECT 1)`)
      .where(sql`(SELECT count(*) FROM player_update_requests WHERE player_id = ${id} AND status = 'pending') < ${MAX_PENDING_PER_PLAYER}`)
  ).returning({ id })   // 0 rows → CONFLICT
  ```
  In `turnstileSecret()`, throw when the site key is configured but the secret is not, and document the secret as required for the deploy.

#### [x] M4. The admin allowlist fails open when `GITHUB_USER_ID` is empty

> **Status:** Fixed: deploy refuses an empty `GITHUB_USER_ID`; sign-in is refused on `https://` without it. No automated test.

- **Severity**: Medium (configuration risk, not an active hole)
- **Location**: `packages/infra/alchemy.run.ts:92-94` (`?? ""` for `GITHUB_USER_ID`, `GITHUB_USERNAME`, `DISABLE_SIGNUP`), `packages/auth/src/owner.ts:9-17,38-40`, `packages/auth/src/index.ts:13-16,38-44,52-66`, `apps/web/.env.example` ("Leave both empty for first-signup-wins")
- **Problem**: when `GITHUB_USER_ID` is blank, `resolveAdminRule` falls back to the GitHub login and then to "first user wins". `isAllowedGithubAccount` returns `true` for every non-`githubId` rule. A deploy with the variable missing, mistyped or removed from `.env.common` (the repo's only copy of the secret is a gitignored file) lets any GitHub account complete the OAuth flow. The first one to do so against an empty `user` table (a restored or recreated database, a new environment) becomes the administrator. The login-based fallback is also the weaker identity the file's own comment warns about (logins can be renamed and reclaimed).
- **Fix**: in `deploy`, fail when `GITHUB_USER_ID` is empty for a production target. In `createAuth()`, throw outside dev when `ownerRule.kind !== "githubId"`. Keep the fallbacks for local dev only.

#### [ ] M5. Children's birth years and sex are public, enumerable, and cross-origin readable (trade-off)

> **Status:** Not changed, deliberately: this is a policy decision. Removing `birthYear` from `/api/v1/players/{id}` would break the documented public contract, and I withdraw the suggestion to hide inactive players from the Swiss Manager export, because a returning inactive player has to be pairable. Decide per the options below if you want either to change.

- **Severity**: Medium (explicit design decision; documented as ADR 0001, flagged so it stays a conscious one)
- **Location**: `packages/api/src/routers/swiss-manager.ts:9-22` (all players, **including inactive ones**, with `birthYear` and `sex`, cached 5 min, no auth), `packages/api/src/http/public-api.ts:46-70,116-122` (`/api/v1/players/{id}` returns `birthYear`), `packages/api/src/http/public-api-contract.ts:12` (`Access-Control-Allow-Origin: *`)
- **Problem**: one request to `swissManager.list` returns name + birth year + sex + club for every player ever registered, many of them minors, including players marked inactive. `/api/v1/players/{id}` returns the same birth year for ids 1…N, from any origin, with no key. The comment on the router says the export is public on purpose for arbiters, and that only the year is stored. Still, the combination makes a ready-made scrape of minors' data, and the inactive rows serve no tournament purpose.
- **Fix** (trade-offs, pick as policy allows): filter `swissManager.list` to `active = true`; return an age group instead of `birthYear` in `/api/v1/players/{id}`; or put the Swiss Manager export behind a shared link/token the arbiters use.

#### [x] M6. Rating import is orchestrated by the browser, one request per row, with no way to resume after a reload

> **Status:** Mitigated, not redesigned: the import now saves the tournament id, created players, finished rows and podium state in `localStorage` per file, so re-uploading the same file after a reload or crash continues instead of failing on the unique tournament name or creating players twice. Start runs only the rows not yet applied. A server-side batch import and clearer 429 handling are still open.

- **Severity**: Medium (design trade-off; the UI already warns on `beforeunload`)
- **Location**: `apps/web/src/hooks/use-rating-import.ts:161-228` (`applyRow`), `:243-272` (tournament created before the rows, then one `players.create` + one `linkWithRating` per row), `:70-76` (progress kept in `useRef`), `:288-304`
- **Problem**:
  1. The import is not atomic and its state lives in memory. If the tab closes, crashes or loses its network mid-run, the tournament row and some players are already written. Re-uploading the same file then fails at `createTournament` (unique `name`) with "No result or podium was applied", so the remainder cannot be resumed from the file. A player created just before the crash is created again on the next attempt (matched by name only, not by id), leaving duplicates that need `players.merge`.
  2. Each row costs 1–3 mutations against a 300/min per-IP limit (`RATE_LIMITS.trpcMutation`). A results sheet of ~150 rows with new players is at that limit when it runs at full speed. A 429 comes back as `{ "error": … }`, not a tRPC envelope (`security.ts:62-72`); how the client reports that was not checked.
- **Fix**: add a server procedure that takes the whole parsed sheet and applies the ratings in one or a few `db.batch` calls (the single-row `applyRatingUpdate` already builds the statements), or at minimum persist the tournament id and created-player ids in `localStorage` next to the report so "resume" works after a reload.

#### [x] M7. Ranking-list dates are UTC days, not federation days

> **Status:** Fixed: archive days and `rankingHistory` use the federation calendar (`federationDayOf`, `federationDayBounds` in `lib/dates.ts`), with a test.

- **Severity**: Medium
- **Location**: `packages/api/src/services/rating-update.ts:314` (`snapshotAt` from `toISOString()`), `packages/api/src/routers/ratings.ts:17-21,39-51,55-57` (`nextDay`, `snapshotOfDay`, `lists` group by UTC `slice(0, 10)`), `packages/api/src/routers/players.ts:239` (`row.at.slice(0, 10)`), `packages/api/src/lib/dates.ts:1-7`
- **Problem**: the maintenance rules use the federation calendar (`federationToday()` for the 3-year inactivity cutoff), but the archive of rating lists is keyed by the UTC date of `snapshotAt`. America/Sao_Paulo (and Maceio) is UTC−3 with no DST, so an import at 21:00–23:59 local time is filed under the next day in `/ratings` archive links and in `rankingHistory` points. The "last import of the day wins" rule in `snapshotOfDay` also merges imports from two different local evenings into one UTC day or splits one evening across two.
- **Fix**: convert once at the edge. Store `snapshotAt` as now, but derive the day with the federation zone in all three places.
  ```ts
  const dayOf = (at: string) => federationDay(new Date(`${at.replace(" ", "T")}Z`));
  ```
  and make `snapshotOfDay` compare against the UTC bounds of that local day.

---

### Low

#### [x] L1. `markComputedStale` can fail a mutation that already committed

> **Status:** Fixed: failure is logged instead of failing the mutation; `images.*` and `cache.purgePublic` no longer invalidate.

- **Severity**: Low
- **Location**: `packages/api/src/index.ts:232-236`
- **Problem**: `markDataChanged` is awaited after `next()` without a `try/catch`, unlike `recordChanges` just below it. A D1 error on that write (the only D1 write that runs on every successful mutation) turns a committed change into an error response, and the computed-results cache is not marked stale either. It also runs for `images.upload`, `cache.purgePublic` and other mutations that change no rows, each of which then forces the next `records.*` request to recompute (~50 ms CPU, per the comment in `computed.ts`).
- **Fix**: wrap in `try/catch` with a `console.error`, and skip it for mutations that write only to R2.

#### [x] L2. `playerRequests.approve` can apply a request that was closed in the meantime

> **Status:** Fixed: the player update is guarded by the request still being pending; a lost race now returns `CONFLICT` and removes the copied photo.

- **Severity**: Low
- **Location**: `packages/api/src/routers/player-requests.ts:182-247`
- **Problem**: the status check happens in a separate read (`:187`). In the batch, the player `UPDATE` is unconditional and only the request `UPDATE` carries `status = 'pending'`. If the request was rejected from another tab between the read and the batch, the player is still modified and verified, the request stays `rejected`, and the call ends with `NOT_FOUND` (empty `closed`), after already moving the photo to `players/`.
- **Fix**: guard the player update with `EXISTS (SELECT 1 FROM player_update_requests WHERE id = ? AND status = 'pending')`, the way `correctRatingVariation` does for `exists(targetRow)`.

#### [x] L3. The `/_auth` guard checks that a session exists, not that it belongs to the administrator, and `getUser` returns the whole session

> **Status:** Fixed: `getUser` returns only `{ id, name, email, image, createdAt }`, and `null` unless `isSessionAdministrator` (now shared with `requireAdmin`) passes, so the `/_auth` guard and login redirect check the administrator, not just a session.

- **Severity**: Low (the tRPC layer does enforce the allowlist, so no data is exposed)
- **Location**: `apps/web/src/routes/_auth/route.tsx:27-33`, `apps/web/src/server/get-user.ts:8`
- **Problem**: any valid session reaches the admin shell. Today only the owner can sign in, but a user row created under an earlier rule (the login or first-user fallback, see M4) keeps a session for up to 7 days after `GITHUB_USER_ID` is set. `getUser` returns `context.session` as is: Better Auth's default session shape includes the session `token`, `ipAddress`, `userAgent` and the user's email, and this value is serialised to the browser (as a server-function result and as route context). That defeats the `HttpOnly` protection on the cookie for anyone who can run script on the page (the signed cookie is still needed to replay the token, so the practical impact is limited).
- **Fix**: return only what the UI uses (`{ user: { id, name, image } }`), and make the guard call a tiny `isAdmin` server function that reuses `isAdministrator`.

#### [x] L4. `ranking_snapshots` has no retention

> **Status:** Fixed: every import deletes snapshots older than 3 years (`SNAPSHOT_RETENTION_YEARS`), with a test.

- **Severity**: Low
- **Location**: `packages/api/src/services/rating-update.ts:316-329`, `packages/db/src/schema/ranking-snapshots.ts`
- **Problem**: each import inserts one row per active player per rating type (a few thousand rows), forever. `change_log` has a retention rule in its write path; this table does not. The indexes keep reads cheap, but the table grows monotonically and every backup/restore carries it.
- **Fix**: keep only the last snapshot of each day older than N months (same "run with every write" pattern as `change_log`), or document the intended growth.

#### [x] L5. Foreign-key columns without an index (cascade and `restrict` checks scan the child table)

> **Status:** Fixed for the two player-id columns that sit on read paths (`tv_sergipe.player_id`, `cup_players.player_id`) plus `cup_players.cup_group_id`; migration `0051`. The other columns stay unindexed until `audits/query-plans.sql` shows a need.

- **Severity**: Low (trade-off; `CONTRIBUTING.md` says not to add an index without a measured reason)
- **Location**: `packages/db/src/schema/` — `cup-players.ts:9-10`, `cup-matches.ts:9-13`, `cup-games.ts:11`, `cup-rounds.ts:9`, `cup-groups.ts:9`, `tv-sergipe.ts:36` (`player_id`), `circuits.ts:15`, `cups.ts:15` (`championship_id`), `players-to-titles.ts:10`, `players-to-roles.ts:10`, `players-to-norms.ts:10`, `players-to-insignias.ts:10`, `defending-champions.ts:10`
- **Problem**: SQLite checks `ON DELETE` actions and the career loaders' `WHERE player_id = ?` with a full scan when the child column has no index. Tables are small today, so this is cheap, but `tv_sergipe.player_id` and `cup_players.player_id` are on the player-profile path and `players.merge` / delete-impact count over them.
- **Fix**: take the numbers from `audits/query-plans.sql` before adding anything. The two player-id columns are the first candidates. Note that adding an index to a table other tables reference follows the `0021_blushing_stature.sql` rule in `AGENTS.md` only for table rebuilds; a plain `CREATE INDEX` is safe.

#### [x] L6. CSP allows inline scripts and any HTTPS origin for images and connections

> **Status:** Partly fixed: `connect-src` is now `'self'` plus the Cloudflare analytics hosts. `script-src 'unsafe-inline'` and `img-src https:` stay (hydration scripts, external image URLs); nonces would need TanStack Start support.

- **Severity**: Low (trade-off)
- **Location**: `packages/api/src/http/security-headers.ts:6,14,17,19`
- **Problem**: `script-src 'unsafe-inline'`, `img-src … https:` and `connect-src 'self' https:` mean a markup-injection bug would be able to run script and exfiltrate to any host. User content is currently safe: the Markdown renderer escapes raw HTML and drops `javascript:` links (checked, see "Verified safe"), SVG uploads are sanitised, and link icons are an allowlist. This is defence in depth.
- **Fix**: use per-request nonces if TanStack Start's hydration script supports them, and narrow `connect-src` to `'self'` plus the analytics host.

#### [x] L7. Orphaned R2 objects have no server-side cleanup

> **Status:** Partly fixed: an R2 lifecycle rule expires `og/` after 90 days, and `deleteMediaUrl` / `deleteReplacedMedia` / `images.delete` keep an object any record still references. There is still no sweeper for objects uploaded and never saved.

- **Severity**: Low
- **Location**: `packages/api/src/routers/images.ts:57` (object written at upload time, before any record references it), `apps/web/src/hooks/use-pending-image-deletes.ts` (client-side best effort), `apps/web/src/server/og-handler.ts:41-56` (one `og/<kind>/<id>-<version>.png` per version, never removed), `packages/infra/alchemy.run.ts:35-41` (lifecycle rule only for `pending/`)
- **Problem**: an upload followed by a closed tab, a failed save, or a post whose title/image changes leaves the old object behind. Each OG image version also stays. `images.delete` (`images.ts:64-70`) removes any key that matches the pattern, and `imageUrl` validators (`input-schemas.ts:32,35`) accept any well-formed `/api/media/…` path, so setting a post's image to another record's path and later replacing it deletes that record's file.
- **Fix**: add an R2 lifecycle rule for `og/` (e.g. 90 days; images are regenerated on demand), and a periodic maintenance procedure that lists `players/ posts/ clubs/ locations/` keys not referenced by any row. Before deleting in `deleteReplacedMedia`, check that no other row uses the same path.

#### [x] L8. The public player API caches a 404 and runs a D1 read for every distinct id

> **Status:** Fixed: ids above 1,000,000 get a 404 without a D1 read or an edge entry.

- **Severity**: Low
- **Location**: `packages/api/src/http/public-api.ts:72-102,117`
- **Problem**: any canonical integer up to 10 digits passes the regex, each one gets its own edge entry and, on a miss, one D1 query (`getPublicPlayer`). The per-IP limiter is the only brake, and it is per colo and approximate. A distributed scan of ids costs D1 read quota while caching nothing useful.
- **Fix**: reject ids above a small bound (e.g. 1,000,000) without a query, or fetch `max(id)` once per cache TTL.

#### [x] L9. Posts: slug is free text, a draft published later keeps its creation date, `listAdmin` is unbounded

> **Status:** Fixed: slug limited to letters, numbers, `-`, `_`; publishing a draft dates it now; `listAdmin` limited to 500.

- **Severity**: Low
- **Location**: `packages/api/src/routers/posts.ts:89,106` (`slug: z.string().trim().min(1).max(200)`), `:23-35` (`listAdmin`, no `limit`), `:115-126` (only `publishAt` ever rewrites `createdAt`)
- **Problem**: a slug containing `/`, `?`, `#` or spaces makes `/noticias/$slug` unreachable (and `feeds.ts:57` / sitemap must re-encode it). Public lists sort by `createdAt`, so an article drafted on Monday and published on Friday appears dated Monday and falls below newer posts. `AGENTS.md` asks for a bounded `limit` on every procedure.
- **Fix**: `z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)`; when `published` flips `false → true` without a schedule, set `createdAt = CURRENT_TIMESTAMP` the way the unschedule branch does; add `.limit(PUBLIC_COLLECTION_LIMIT)`.

#### [x] L10. `tournaments.update` writes in separate statements

> **Status:** Fixed: the update and its podium delete or sync run in one `db.batch`; the delete re-reads the flag so a refused update removes nothing.

- **Severity**: Low
- **Location**: `packages/api/src/routers/tournaments.ts:307-314`
- **Problem**: the row update, the `hasPodiums = false` delete, and the sync `batch` for `hasPodiums = true` are three round trips. A failure after the first leaves `has_podiums` flipped but podiums not removed or not re-synced. `AGENTS.md` asks for multi-statement writes in one `db.batch`.
- **Fix**: build the update, the delete or the sync statements, and run them in a single `ctx.db.batch([...])`.

#### [x] L11. Inactivity maintenance overrides a manual "active" without telling anyone

> **Status:** Fixed by traceability, not prevention: each deactivation is written to the change log under the `system` actor. A flag to exempt a player from the rule was not added.

- **Severity**: Low (documented FSX rule; flagged because it silently reverts an admin action)
- **Location**: `packages/api/src/services/rating-update.ts:266-282` (`deactivateStalePlayers`), `packages/api/src/routers/players.ts:175-184` (`bulkSetActive`)
- **Problem**: an administrator can set `active = true` on a player with no activity in the last 3 years (a returning veteran, say). The next import's `snapshotRankings` sets them inactive again, with only a count in the toast and no change-log row (the batch statements are not tracked).
- **Fix**: either record the deactivated ids in `change_log`, or add a `locked_active` flag the rule respects.

#### [x] L12. The rate limiter fails open if a binding is missing

> **Status:** Fixed: a missing binding logs once per isolate. No test reads `alchemy.run.ts`.

- **Severity**: Low
- **Location**: `packages/api/src/http/security.ts:48-49`
- **Problem**: `limiter ? await limiter.limit(…) : { success: true }`. A renamed or dropped binding in `alchemy.run.ts` removes every rate limit without a log line, and `RATE_LIMITS` is only "kept in sync" by a comment (`alchemy.run.ts:41`).
- **Fix**: `console.error("[security] rate limit binding missing", config.binding)` once per isolate, and cover the four names with a test that reads `alchemy.run.ts`.

---

### Nitpick

- [x] **N1. Time zone constant**: `packages/api/src/lib/dates.ts:1` and `apps/web/src/components/noticias/post-time-ago.tsx:7` use `America/Sao_Paulo`; the federation is in Sergipe (`America/Maceio`). Identical today (no DST since 2019); only matters if rules change. — *Fixed: `America/Maceio` everywhere.*
- [x] **N2. Browser year in dialogs**: `apps/web/src/components/admin/create-dialogs.tsx:261,290` use `new Date().getFullYear()` (browser zone) for the default circuit year and the next announcement number. Use the federation year, as the API does. — *Fixed: dialogs use `federationYear()`.*
- [x] **N3. Text limit vs D1 row size**: `packages/api/src/input-schemas.ts:29` allows 500,000 characters for `contentText`; with multi-byte text that can exceed D1's 2 MB row limit and fail as a generic 500. A byte-length refine (or ~250,000) gives a proper `BAD_REQUEST`. — *Fixed: `contentText` also limited to 1.8 MB of UTF-8.*
- [x] **N4. Overlapping player indexes**: `packages/db/src/schema/players.ts:33,38,41-43` — `players_active_idx`, `players_active_birth_year_idx`, `players_classic_idx`, `players_rapid_idx`, `players_blitz_idx` are prefixes or near-duplicates of the composite indexes below them. Every import writes all of them. Drop only after `audits/query-plans.sql` confirms the planner does not use them (`CONTRIBUTING.md`: measure first). — *Measured and fixed: with 4,000 players, with and without `ANALYZE`, dropping `players_sex_idx`, `players_classic_idx` and `players_blitz_idx` changes no query plan and no rows read, so migration `0052` removes them. `players_active_idx`, `players_active_birth_year_idx` and `players_rapid_idx` each serve a public query (sitemap/API ordering, age-group filter, unfiltered rapid sorts) and stay. Queries added to `audits/query-plans.sql`.*
- [x] **N5. Spoofable IP fallbacks**: `packages/api/src/http/security.ts:5-11` falls back to `X-Forwarded-For`, then to `127.0.0.1`. Behind Cloudflare `CF-Connecting-IP` is always present, so it is only a risk if the Worker is ever reached another way; a missing IP would put all callers in one bucket. — *Fixed: only `CF-Connecting-IP` is trusted.*

---

### Checked and found sound

- **Admin coverage**: every router mutation and every non-public query is on `adminProcedure`. The only `publicProcedure` mutation is `playerRequests.submit`. `protectedProcedure` is defined but unused. `requireAdmin` re-checks the numeric GitHub account id against `account.account_id` on each call, so the allowlist is enforced server-side and not only in the UI.
- **Sign-in lock**: `mapProfileToUser` rejects a non-owner before any user row is created, including returning users.
- **CSRF / CORS**: tRPC and auth POSTs require a trusted `Origin`; a cross-origin tRPC GET carries an `Origin` and gets 403. Only `/api/v1/*` is `Access-Control-Allow-Origin: *`, and it is GET/OPTIONS only.
- **Edge cache**: authenticated requests (session cookie) skip the cache, a forged cookie only costs a rate-limit hit, and only successful payloads are stored. `getProcedureCachePolicy` returns `never` for any batch that includes an unlisted (admin) procedure.
- **News content XSS**: the Markdown renderer (`@tanstack/markdown` 0.0.12, used without `allowHtml`) escaped `<script>`, `<img onerror>` and `<a href="javascript:…">` and dropped `javascript:` link targets in a direct render test. `dangerouslySetInnerHTML` is used only for link icons, which `isKnownLinkIcon` restricts to a fixed set on write and again on render.
- **R2 uploads**: extension and MIME come from a server allowlist, raster content is checked by magic bytes, SVG is parsed and sanitised, keys are server-generated UUIDs, `/api/media` sets `nosniff` and a sandbox CSP, and the public form's photos go to a private `pending/` prefix with a 30-day lifecycle rule. Replaced and deleted records remove their image (players, posts, clubs, locations, cups).
- **Rating arithmetic**: `applyRatingUpdate` is an optimistic-locked `UPDATE` + `INSERT … SELECT … WHERE changes() = 1` in one batch; correction, removal and tournament revert shift the rest of the chain with deltas computed inside the batch. `players.merge` moves every `restrict` foreign key (checked against the schema) in one batch.
- **Secrets**: `.env*` files are gitignored; no tokens or keys in tracked files; `VITE_` variables used are the analytics token, the Turnstile site key and the image-transformation flag only. The dev-seed/restore scripts exclude logins and sessions.
- **Migrations**: 51 SQL files match 51 journal entries; table rebuilds on referenced tables use the backup/drop/recreate pattern; `migrations.integration.test.ts` passes.
