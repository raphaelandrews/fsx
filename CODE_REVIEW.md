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

---

## Phase 2: Performance, architecture and clean code

Scope: `apps/web` (routes, components, hooks, lib, server), `packages/api`, `packages/db`, `packages/ui`, `packages/env`, package manifests and the build output. Read-only; no source file was changed. Findings use the `P2-` prefix and the same `[ ]` / `[x]` convention. Phase 1 findings are not repeated.

### How it was measured

| Check | Result |
| ----- | ------ |
| Client build (`dist/client`) | 288 JS chunks, 925 KB gzip in total; `check:bundle` budgets pass |
| Initial JS graph of a public page (entry plus its static imports) | 98 chunks, about 300 KB gzip; the entry chunk alone is 88 KB gzip |
| CSS | 238 KB raw, 38 KB gzip, one file |
| Worker (`dist/server`) | 12 MB on disk, about 2.0 MB JS gzip plus 1.4 MB of WASM (`resvg`, `yoga`) |
| Worker static graph evaluated at start | 17 modules, 0.9 MB; the first request then loads `auth-middleware` (1.3 MB) and `router` (0.4 MB) |
| `createAuth()` | 1.6 ms per call; `createContext` 1.7–2.2 ms per call (Bun, no network) |
| Types | 1 `as unknown as`, 2 `any` in non-test code (`seed.ts`, `env/web.ts`), no `@ts-ignore`, no TODO/FIXME |

Everything marked **Verified** was reproduced with a build artefact or a scratch script outside the repo; the rest was read from the code.

Counts: 0 Critical, 0 High, 6 Medium, 14 Low, 10 Nitpick.

After the fixes (checks in `bun run check-types`, `lint`, `bun test` 528 pass, `build`, `check:bundle`, `check:routes`, `check:ssr` 42 routes, and the Playwright suite, 138 pass):

| Measure | Before | After |
| ------- | ------ | ----- |
| Initial JS graph of a public page | 98 chunks, 300 KB gzip | 52 chunks, 204 KB gzip |
| Worker JS (gzip) | 1.99 MB | 1.79 MB |
| Findings checked off | | 23 of 30 (P2-M6, P2-L1, P2-L11 and P2-L12 only in part); open: P2-M1 (documented decision), P2-L5, P2-L7, P2-L13, P2-N2, P2-N5, P2-N8 |

---

### Medium

#### [ ] P2-M1. Public pages are rendered from D1 on every view; the edge cache only serves client-side navigation (trade-off)

> **Status:** Not done, on purpose: `rendering-and-caching.mdx` ("Why SSR HTML is not cached") and ADR 0003 record a decision not to cache HTML, with a revisit condition (D1 reads near the plan limit, or Worker CPU visible) that is not met. I built and tested a Worker-side version (anonymous `GET` only, session-cookie bypass, 200 `text/html` only, `X-Page-Cache` header, a custom `src/server.ts` selected through `wrangler.main: "../../src/server.ts"` in `alchemy.run.ts`) and then removed it. Two things it showed: the page TTL must stay below the shortest route `staleTime` (30 s on `/`), or hydrated data is refetched at once and the "hydrates without refetching" e2e fails; and the Worker entry comes from the generated `.alchemy/local/wrangler.jsonc`. Say the word and I will re-apply it.

- **Severity**: Medium
- **Location**: `apps/web/src/router.tsx:56-62` (server links call the router in-process), `packages/api/src/http/trpc-handler.ts:87-88` (the comment that says so), `apps/web/src/routes/__root.tsx:35` (`headers` only adds security headers). No `Cache-Control` is set for HTML anywhere in `apps/web/src` (the only matches are the sitemap, RSS, OG, auth and media handlers).
- **Problem**: `PROCEDURE_CACHE_POLICY` (60 s to 5 min per procedure) is applied only to `GET /api/trpc`, which the browser uses after hydration. A first page load never goes through it: the loaders call `appRouter` through `unstable_localLink`, so every anonymous view of `/`, `/ratings`, `/jogadores/:id` and so on runs its D1 queries again. Search engines, social crawlers and first-time visitors, who are most of the public traffic, never benefit. The player profile alone runs seven procedures (`jogadores/$id/index.tsx:12-24`); the home page five. The sitemap and RSS already solved this with `caches.default`, so the pattern exists.
- **Fix**: add a small server entry (or a TanStack Start middleware) that, for anonymous `GET`/`HEAD` requests to public paths, serves and stores the rendered HTML in `caches.default` with the same TTL logic, and skips it when the request has a session cookie (`hasSessionCookie` already exists). Keep TTL at or below the shortest procedure TTL on the page (60–120 s). Trade-off: data can be that stale on first load, which the client-side cache already accepts.

#### [x] P2-M2. The web app has no `_headers`: static assets and prerendered pages get neither long-lived caching nor security headers

> **Status:** Fixed: `apps/web/public/_headers` makes `/assets/*` immutable and gives the two prerendered pages the same headers as `SECURITY_HEADERS`; `static-headers.test.ts` fails if the file drifts from `SECURITY_HEADERS` or from the prerender list in `vite.config.ts`. The security block is scoped to those pages on purpose: a `/*` block put a CSP on `robots.txt`, which broke the cross-origin API e2e that uses it as a host page.

- **Severity**: Medium
- **Location**: absence of `apps/web/public/_headers` (`apps/fumadocs/public/_headers` exists and shows the intent); `apps/web/vite.config.ts:41-47` (`/sobre` and `/normas-tecnicas` are prerendered); the generated `apps/web/dist/server/wrangler.json` (`"run_worker_first": false`, so static files are answered without the Worker)
- **Problem**: `dist/client` contains no `_headers`. Hashed files under `/assets/` (288 JS chunks, CSS, fonts) therefore rely on the platform default, which for Workers static assets is revalidate-on-every-request (`max-age=0, must-revalidate`) unless a zone rule raises it; Phase 1 noted the zone's Browser Cache TTL does override headers, but that gives 4 hours, not a year, and only if that setting is on. The two prerendered pages are served as static files, so the Worker's `headers: () => SECURITY_HEADERS` never runs for them: no CSP, HSTS, `X-Frame-Options` or `nosniff` on those routes, while the same security headers are set for every SSR page and for the docs site. (If a Cloudflare transform rule adds them, this part does not apply; check with `curl -I https://www.fsx.org.br/sobre`.)
- **Fix**: add `apps/web/public/_headers`:
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  /*
    Content-Security-Policy: …   # same value as SECURITY_HEADERS
    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
  ```
  Generate it from `SECURITY_HEADERS` in a build step so the two cannot drift.

#### [x] P2-M3. Avatar photos are not in the HTML and cannot be lazy-loaded; the profile's main photo waits for JavaScript

> **Status:** Fixed: `AvatarImage` is a plain `<img>` (lazy, async, with an `onError` fallback) over the fallback, so photos are in the server HTML; the profile hero uses `loading="eager"` and `fetchPriority="high"`. All 138 e2e tests, including the a11y scans, pass.

- **Severity**: Medium. **Verified.**
- **Location**: `packages/ui/src/components/avatar.tsx:26-35` (`AvatarImage` wraps Base UI), used at `apps/web/src/components/player/player-hero.tsx:43`, `player-sheet-button.tsx:34`, `torneios/tournament-podium.tsx:51,103`, `routes/_public/membros.tsx:173`, `components/player/update-request-form.tsx:270,351`
- **Problem**: Base UI 1.6 `AvatarImage` creates `new window.Image()` in an effect (`useImageLoadingStatus.js:25`) and renders the real `<img>` only when its status is `loaded` (`AvatarImage.js:42`). Consequences: on the server only the gradient fallback is rendered, so there is no `<img>` for the browser's preload scanner or for crawlers; every avatar on a page is requested right after hydration, whether on screen or not (`/membros` lists every role holder, up to 500 by the procedure's limit; `/ratings` and the podiums dozens); and the profile hero photo, probably the LCP element of `/jogadores/:id` (not measured in a browser), starts downloading only after the JS bundle runs. The `loading="lazy"` attributes used elsewhere in the app (club logos, flags) are not available here.
- **Fix**: for list rows and podiums render a plain `<img width height loading="lazy" decoding="async" {...avatarImage(url, size)}>` inside the fallback-coloured container (the gradient stays visible until the image paints); for the hero use `fetchPriority="high"` and no lazy loading. Keep `Avatar` only where the load/error fallback matters (upload preview).

#### [x] P2-M4. About 29 KB gzip of admin-only code sits in every public page's initial graph

> **Status:** Fixed and measured: the initial JS graph of a public page went from 98 chunks / 300 KB gzip to 52 chunks / 204 KB (about 96 KB less, more than the 29 KB estimated, because the shell pulled in more). `getUser` is imported inside `beforeLoad` and loaders, and the `/_auth` error and pending components live in `components/admin/auth-boundary.tsx`, loaded with `lazyRouteComponent`. `pendingComponent` is not code-split by default, which is why the shell had leaked.

- **Severity**: Medium. **Verified.**
- **Location**: `apps/web/src/routes/_auth/route.tsx:4-6` (static imports of `AdminShell`, `getUser`) and `:27-33`; `apps/web/src/routes/login.tsx:8`; `apps/web/src/server/get-user.ts`; `apps/web/src/lib/auth-client.ts`
- **Problem**: the entry chunk `index-*.js` has static imports of `admin-shell` (6.8 KB gzip), `auth-client` (11.6 KB, Better Auth's React client, pulled in by the shell), and `get-user` (11.1 KB, the server-function client). The `/_auth` route module references them directly (`beforeLoad` calls `getUser`; its inline `errorComponent` and `pendingComponent` render `AdminShell`), and that module is part of the route tree the entry loads, so they end up in the graph every public page loads. That is about a tenth of the 300 KB initial graph, for visitors who can never use it. The 24 KB zod bundle (`schemas-*.js`, from `search-schemas.ts`) is also in that graph; that one is needed for search-param validation, so it is a trade-off, but `zod/mini` would roughly halve it.
- **Fix**: import `getUser` lazily inside `beforeLoad` (`const { getUser } = await import("@/server/get-user")`) and move the `/_auth` error and pending components to their own file that is referenced through `lazyRouteComponent`, so the shell is not statically reachable from the route module. Re-run `scripts/check-bundle-budgets.mjs` after the change; its `initialGraphGzipBytes` budget is 330 KB against about 300 KB today, so this is where the headroom is.

#### [x] P2-M5. The ratings archive was removed from the UI, but its backend, cache entries, tests, docs and a Phase 1 fix remain

> **Status:** Fixed by removal (the UI was removed on purpose in `9fd12ff`): deleted `routers/ratings.ts`, its two cache-policy entries, its test, `ratings-archive/`, `ratingArchiveSearchSchema`, the `measure.ts` entries, the stale `/ratings/lista/$data` entry in `check-route-tree.mjs`, `federationDayBounds`, and the doc rows; ADR 0007 now says the archive was removed. `federationDayOf` stays for `players.rankingHistory`.

- **Severity**: Medium (dead code that is still maintained). **Verified.**
- **Location**: `packages/api/src/routers/ratings.ts` (whole router), `packages/api/src/cache/cache-policy.ts:13-14` (`ratings.lists`, `ratings.snapshot`), `packages/api/src/ratings-archive.integration.test.ts`, `apps/web/src/components/ratings-archive/format.ts` (the only file left in that folder), `apps/web/src/lib/search-schemas.ts:82` (`ratingArchiveSearchSchema`), `apps/fumadocs/content/docs/reference/procedures.mdx:67-68`, `decisions/0007-ranking-snapshots.mdx:76`
- **Problem**: commit `9fd12ff` deleted `routes/_public/ratings/lista/index.tsx` and `lista/$data.tsx`. Nothing in `apps/web/src` calls `ratings.lists` or `ratings.snapshot` any more, yet both are public, cached and documented, `ratingArchiveSearchSchema`, `formatArchiveDate` and `RHYTHM_TABS` are unused, and the snapshot rows that feed the archive are still written and now pruned on every import. The Phase 1 timezone fix (M7) was applied to code no page reaches.
- **Fix**: decide. Either restore the two routes (the procedures, tests and docs are ready) or delete the router, its two policy entries, its test, `ratings-archive/`, the unused schema and the doc rows. Snapshots themselves stay: `players.ranking`, `rankingHistory` and the movement arrows use them. Trade-off: removal loses a public API surface that someone may have bookmarked.

#### [x] P2-M6. Every in-process tRPC call builds a new Better Auth instance and looks the session up in D1

> **Status:** Mostly fixed: Better Auth is built once per D1 binding (`createAuth`, with a test), `session.cookieCache` is on (5 min), and one request context is shared by all procedures of a server render (`contextOf` in `router.tsx`). Not done: caching the administrator decision per session, because it would let a stale grant outlive a change to `GITHUB_USER_ID` or to the `account` row within one isolate.

- **Severity**: Medium
- **Location**: `packages/api/src/context.ts:17-24` (`createAuth()` per context), `apps/web/src/router.tsx:59-62` (the context factory runs once per procedure call on the server), `packages/auth/src/index.ts:13-33` (no `session.cookieCache`), `packages/api/src/index.ts` (`requireAdmin` adds one `account` query to every admin call)
- **Problem**: `createAuth()` costs 1.6 ms of CPU (about 2.2 ms for a whole `createContext`) and runs once per procedure, so the player page spends roughly 12–15 ms of CPU on auth set-up before any SQL, and an anonymous visitor pays it as well. With a session cookie, each call also reads the session and user from D1; with an admin session, `requireAdmin` reads the GitHub account again. A rating import of 300 rows therefore runs about 300 × (session + account + `computed_results` write + the work itself) D1 operations. On Workers CPU time is the quota that matters.
- **Fix**: build the auth object once per isolate (it only depends on bindings that do not change), reuse one context per request on the server, enable `session: { cookieCache: { enabled: true, maxAge: 300 } }`, and cache the administrator decision per session token for a minute. Trade-off: a revoked session stays valid for up to the cache window.

---

### Low

#### [x] P2-L1. The player profile fetches more than it renders and starts one request after hydration

> **Status:** Partly fixed: `clubs.standing` returns one club's row (public, 300 s) and replaces the whole-leaderboard download on the profile and in the player sheet. Not done: prefetching `records.badges` in the loader; the e2e `requests.e2e.ts` deliberately expects the badge rarity to be a non-blocking client fetch.

- **Severity**: Low
- **Location**: `apps/web/src/routes/_public/jogadores/$id/index.tsx:20,22,62-63`, `apps/web/src/components/player/player-profile.tsx:113-115`
- **Problem**: The route downloads the whole club leaderboard (every club's strength, rank and medals) and also embeds it in the dehydrated HTML to look up one club's standing. Also, `records.badges`, the all-players holder map, is requested with a plain `useQuery` after hydration, so the "record holder" and rarity data appear one round trip late and are not in the HTML.
- **Fix**: add a `clubs.standing({ clubId })` procedure (or return `clubStanding` from `players.byId`); prefetch `records.badges` in the loader without awaiting it, or move it to `useSuspenseQuery` behind a `Suspense` boundary; keep `rankingHistory` out of the awaited list.

#### [x] P2-L2. Rating-format and tier labels are redefined in 14 places

> **Status:** Fixed: `RATING_LABELS_PT` / `RATING_LABELS_EN` in `packages/api/src/rating-types.ts` and `COMPETITION_TIER_LABELS_PT` in `packages/db/src/competition.ts` replace the local copies in 14 files.

- **Severity**: Low
- **Location**: Portuguese: `components/torneios/labels.ts:11` (`RHYTHM_LABELS`), `components/comparar/compare-table.tsx:11`, `components/home/ratings/data-options.ts:44`, `components/player/player-rating-picker.tsx:9`, `components/campeoes/champions-tabs.tsx:24`, `components/home/ratings/top-players.tsx:16`, `components/recordes/statistics-charts.tsx:23`, `components/player/tournament-history-columns.tsx:64`; English: `components/rating-update/rating-history-editor.tsx:15`, `rating-update/import-review.tsx:17`, `hooks/use-rating-import.ts:20`, `components/swiss-manager/swiss-manager-workbook.ts:9`, `components/admin/player-form.tsx:59`, `components/admin/tier-calibration-card.tsx:12`; tiers: `components/torneios/labels.ts:4` vs `COMPETITION_TIER_LABELS` in `packages/db/src/competition.ts:12`
- **Problem**: the same three words (and the four tier names) are written out again in each file, with two different spellings of the same label in each language. A new rhythm or a renamed tier means 14 edits and some will be missed.
- **Fix**: one `RATING_TYPE_LABELS: Record<RatingType, { pt: string; en: string }>` next to `RATING_TYPES` in `packages/api/src/rating-types.ts`, and one tier map with the same shape; delete the local copies.

#### [x] P2-L3. Closed-set text columns are typed as `string`, which forces about 26 casts

> **Status:** Fixed: `rating_type`, `tier`, circuit `type` and player `sex` are typed with `{ enum: … }` (constants moved to `@fsx/db/competition`, re-exported by the old API modules); `drizzle-kit generate` reports no schema change. The `RatingType` / `CompetitionTier` casts on database values are gone; the ones on form strings stay. The `tv_sergipe` columns were left as they are.

- **Severity**: Low
- **Location**: schema: `packages/db/src/schema/tournaments.ts` (`rating_type`, `tier`), `players-to-tournaments.ts` (`rating_type`), `circuits.ts` (`type`, `tier`), `tv-sergipe.ts` (`age_group`, `sex`, `modality`); casts: `packages/api/src/routers/tournaments.ts:181-184,212`, `services/rating-update.ts:126,214`, `gamification/load.ts:39,169`, `routers/circuits.ts:212`, `gamification/circuits.ts:92`; web: `routes/_public/torneios/$id.tsx:38,66-67`, `components/torneios/tournament-table.tsx:38-39`, `components/player/player-profile.tsx:147`, `components/comparar/compare-table.tsx:100`, `components/tv-sergipe/tv-sergipe-view.tsx:481-482`, `routes/_auth/dashboard/circuits/{$id,index}.tsx`, `tournaments/{$id,index}.tsx`, `components/admin/create-dialogs.tsx:273-274,356` (about seven more)
- **Problem**: the values are already constrained by `CHECK`s or by zod enums, but Drizzle infers `string`, so every reader casts (`row.ratingType as RatingType`). A wrong cast compiles silently, and `?? row.ratingType` fallbacks next to the casts show the types are not trusted.
- **Fix**: `text("rating_type", { enum: RATING_TYPES })` (and the same for tier, circuit type, sex, age group, modality). This changes types only, so it needs no migration, and the casts can go.

#### [x] P2-L4. Validation limits are duplicated between the form layer and the API, and have already drifted

> **Status:** Fixed: `packages/api/src/field-limits.ts` holds the limits; `input-schemas.ts`, `field-rules.ts` and `event-form.tsx` use it, the form now also checks the 1.8 MB byte limit, and it counts code points like zod (a test covers it).

- **Severity**: Low
- **Location**: `apps/web/src/lib/field-rules.ts:6-8` (`TEXT_MAX = 160`, `URL_MAX = 2_048`, `LONG_TEXT_MAX = 500_000`), `apps/web/src/components/admin/event-form.tsx:161` (`maxLength={2048}`), against `packages/api/src/input-schemas.ts` (`nameText`, `httpUrl`, `contentText`)
- **Problem**: the browser re-implements the server's limits by hand. Since Phase 1 N3, `contentText` also rejects text over 1.8 MB of UTF-8, which the form does not check, so a long multi-byte article passes the form and fails on the server with a generic message.
- **Fix**: export the three constants from `input-schemas.ts` (it has no server imports) and use them in `field-rules.ts` and `event-form.tsx`; add the byte check to `maxLengthError`.

#### [ ] P2-L5. Three identical join routers

> **Status:** Not done: a typed factory over three Drizzle relations (`title`, `role`, `insignia`) would need casts or loose generics to keep the router output types the dashboard relies on, for about 70 duplicated lines. The over-fetch (`with: { title: true }`) is also unchanged.

- **Severity**: Low
- **Location**: `packages/api/src/routers/players-to-titles.ts`, `players-to-roles.ts`, `players-to-insignias.ts` (38 lines each; `diff` after renaming the entity shows no differences)
- **Problem**: copy-pasted `listByPlayer` / `link` / `unlink`. They also load the whole related row (`with: { title: true }`) where the admin UI shows a name.
- **Fix**: a `playerJoinRouter(table, otherColumn, label)` factory in `crud.ts` (which already holds `deleteById`), with explicit `columns`, as `AGENTS.md` asks for procedures.

#### [x] P2-L6. Two comments in `players.ts` are wrong, and one hides a thin safety margin

> **Status:** Fixed: both comments corrected, and the comment now states the parameter budget (96 of 100 at `limit` 90).

- **Severity**: Low. **Verified.**
- **Location**: `packages/api/src/routers/players.ts:255` ("`players_rapid_idx` drives the ORDER BY + LIMIT"), `:462-463` ("Drizzle issues one query per relation keyed on the page ids")
- **Problem**: the plan for that query uses `players_active_rapid_idx` (see the audit in `audits/query-plans.sql`). And `db.query.players.findMany({ with: … })` on SQLite is a single statement with one correlated `json_group_array` sub-select per relation (checked with `.toSQL()`), not a query per relation. That matters for D1's parameter limit: the page query for `limit: 90` binds 96 parameters (90 ids plus a `limit ?` per relation), so adding one more relation with a limit, or a fifth filter, will break the page again.
- **Fix**: correct both comments; add a test that runs `withFilters` at the maximum `limit` (Phase 1 added one for the ranking path) and note the 100-parameter budget next to `limit`.

#### [ ] P2-L7. Long functions and mixed-concern files

> **Status:** Partly done: `index.ts` was split into `index.ts`, `errors-normalize.ts` and `admin-guard.ts`. The long components and the 451-line import hook were not touched, because there is no way to verify those refactors beyond the e2e suite and they carry no known bug.

- **Severity**: Low
- **Location**: `components/player/update-request-form.tsx` (one 403-line component in a 483-line file), `components/circuitos/admin/circuit-editor.tsx` (316-line component), `components/bullet/bullet-client.tsx` (287-line component in a 642-line file, inside the public bundle), `routes/_public/ratings/index.tsx` (254-line route component with about 150 lines of inline table rows), `components/tv-sergipe/tv-sergipe-view.tsx` (240 lines), `hooks/use-rating-import.ts` (451 lines: file parsing, planning, applying, persistence and reporting), `packages/api/src/index.ts` (277 lines: tRPC init, unique-violation sentence building, three middlewares and the procedure builders), `gamification/badges.ts` (782 lines)
- **Problem**: hard to review and to test. The rating-import hook and the request form carry business rules (when a row is created or rated, which fields count as a change) that are only testable through React.
- **Fix**: split along existing seams: move the planning and apply loop of `use-rating-import.ts` into plain functions in `lib/` (the planning part already is); split `index.ts` into `trpc.ts`, `errors-normalize.ts`, `admin-guard.ts`; extract the ratings table row into `components/ratings/player-row.tsx` (the home page's `columns.tsx` already renders the same data).

#### [x] P2-L8. Dead code in application packages

> **Status:** Fixed: removed `protectedProcedure`, `PENDING_KEY_PATTERN`, `sql-in-list.ts`, `env/web.ts`, `CalendarEventData`, the `tv-sergipe` label maps, 20 unused `insert*Schema` exports, nine unused UI primitives and the five capybara files. Adding `knip` to CI was not done.

- **Severity**: Low. **Verified** with an export-usage scan across the repo (types and Drizzle relations excluded, since they are consumed through `import * as schema`).
- **Location**: `packages/api/src/index.ts` (`protectedProcedure`), `packages/api/src/media-kinds.ts` (`PENDING_KEY_PATTERN`), `packages/db/src/sql-in-list.ts` (the whole file), `packages/env/src/web.ts` and its dependency `@t3-oss/env-core`, `apps/web/src/components/calendario/calendar-event.tsx` (`CalendarEventData`), `apps/web/src/routes/_auth/dashboard/tv-sergipe/-constants.ts` (`SEX_LABELS`, `MODALITY_LABELS`), the `insert*Schema` exports in `packages/db/src/schema/` that no router uses (about 20, e.g. `insertCupSchema`, `insertTvSergipeSchema`, `insertRankingSnapshotSchema`), `packages/ui/src/components/{attachment,bubble,empty,marker,menubar,message,message-scroller,pagination,scroll-area}.tsx` (about 1,200 lines of unused shadcn primitives), `apps/web/public/capybara*.{gif,webp}` (five files, referenced nowhere)
- **Problem**: unused surface to read, type-check and keep consistent; several appear in the docs as if they were in use (`env/web`).
- **Fix**: delete them (the UI primitives can be re-added with the shadcn CLI). Add `knip` (or an equivalent) to CI so this stays at zero.

#### [x] P2-L9. Unused and duplicated dependencies

> **Status:** Fixed: removed the unused dependencies listed (including the `web` self-dependency and the `libsql` pair), de-duplicated the root manifest, and regenerated `bun.lock`; `@fontsource-variable/fustat` was added to `apps/web` for the preload.

- **Severity**: Low. **Verified** with an import scan of each workspace.
- **Location**: `apps/web/package.json`: `@libsql/client`, `libsql`, `@tanstack/react-pacer`, `@tanstack/react-virtual`, `react-use-measure`, `web-vitals`, `dotenv`, `jsdom`, `@testing-library/dom`, `@testing-library/react`, and `"web": "^0.0.2"` (a package depending on itself: `bun.lock` resolves it to `web@workspace:apps/web`); `packages/db/package.json`: `@libsql/client`, `libsql`; `packages/api/package.json`: `@trpc/client`, `dotenv`; `packages/auth/package.json`: `dotenv`; `packages/env/package.json`: `zod`, `@t3-oss/env-core`; `packages/ui/package.json`: `date-fns`; root `package.json`: `@tanstack/router-plugin`, and runtime copies of `@tanstack/react-query`, `react-router`, `ssr-query`, `motion`, `zod`, `dotenv` that are also declared in `apps/web` with different ranges (`^5.104.5` vs `^5.101.4` for react-query, for example)
- **Problem**: install time and attack surface (`libsql` ships native binaries and is not used since the move to D1), a self-referencing dependency that looks like a typo-squat on first read, and version ranges declared twice.
- **Fix**: remove the unused ones; declare shared ranges once in the root `catalog`; delete the `web` self-dependency.

#### [x] P2-L10. Several images are served at full size

> **Status:** Fixed: the article hero, cup image, member avatars and the 16–20 px emblems now use `coverImage` / `avatarImage`.

- **Severity**: Low
- **Location**: `apps/web/src/components/noticias/post-article.tsx:28` (article hero, `post.imageUrl` as is, with `fetchPriority="high"`; the card on the list page uses `coverImage` correctly), `components/bullet/bullet-client.tsx:267` (`cup.imageUrl`), `routes/_public/membros.tsx:173` (member avatars at 44 px use the original), `components/circuitos/columns.tsx:127`, `components/clubes/club-logo.tsx:7`, `components/tv-sergipe/tv-sergipe-view.tsx:364`, `routes/_public/ratings/index.tsx:287,305` (20 px logos and flags use the original, up to 512 KB each by policy)
- **Problem**: `lib/media-image.ts` already provides `coverImage` and `avatarImage`, but only some call sites use them. A hero photo is up to 5 MB by policy (cropped in the browser, so usually far less), and a table of 20 players loads 40 emblem files.
- **Fix**: use `coverImage(post.imageUrl, "(min-width: 768px) 720px, 100vw")` for the hero and cup image, `avatarImage(url, 44)` for members, and a 48-px variant for emblems.

#### [x] P2-L11. Fonts: nothing is preloaded, and two unreferenced font files are emitted

> **Status:** Partly fixed: the Fustat latin file is preloaded from the root route. The two unreferenced font files (`Inter`, `Bricolage`) are still emitted; I did not find what emits them.

- **Severity**: Low
- **Location**: `apps/web/src/routes/__root.tsx:64-73` (`links` has no `preload`), `packages/ui/src/styles/globals.css:14-35` (Fustat is `font-display: swap`), `apps/web/dist/client/assets/Inter-latin-*.woff2` and `BricolageGrotesque-Bold-*.ttf` (150 KB together)
- **Problem**: the body font (Fustat, two files) is discovered only after the CSS is parsed, so first paint uses the fallback and then reflows when `swap` kicks in (a possible layout shift on cold visits). The Inter and Bricolage files exist in the public asset directory but no CSS or client chunk references them.
- **Fix**: import the latin Fustat file with `?url` and add `{ rel: "preload", as: "font", type: "font/woff2", href, crossOrigin: "anonymous" }` to the root `links`; find what emits the two unreferenced fonts (they are not in the site's CSS) and exclude them from the client output.

#### [x] P2-L12. Worker size and cold path

> **Status:** Partly fixed: a Vite plugin gives the server build an empty `xlsx` module; the Worker's JS went from about 1.99 MB to 1.79 MB gzip and the 820 KB chunk is gone. Better Auth's Kysely adapter and SQLite dialects are third-party code and remain.

- **Severity**: Low (trade-off with third-party code)
- **Location**: `apps/web/dist/server/assets/` — `auth-middleware-*.js` 1.3 MB, `xlsx-*.js` 821 KB, `og-render-*.js` 784 KB plus 1.4 MB of WASM, `sqlite-introspector-*.js` 282 KB and the `bun`/`node`/`d1` SQLite dialect chunks; `apps/web/src/lib/rating-import-file.ts` (dynamic `import("xlsx")`)
- **Problem**: the Worker is about 3.4 MB (gzipped JS plus the WASM files as they are), above the 3 MB free-plan limit, and a cold isolate loads about 2.9 MB of JS on its first request. Part of it is dead weight: the `xlsx` chunk is built into the server because a client-only dynamic import is also visible to the SSR build, and Better Auth ships its Kysely adapter and SQLite dialects even though the app uses the Drizzle adapter.
- **Fix**: mark `xlsx` as external (or alias it to an empty module) for the SSR build; check whether the Better Auth version offers an import path without the Kysely adapter. Measure again with `wrangler deploy --dry-run --outdir` to see the real upload size. Trade-off: the SSR alias must not affect the client chunk.

#### [ ] P2-L13. `/ratings` waits for two filter lists it does not need to paint

> **Status:** Not done: I made the two lists non-blocking and reverted it, because `requests.e2e.ts` requires `/ratings` to hydrate without refetching and to reuse prefetched data on click; the lists are cached at the edge and small.

- **Severity**: Low
- **Location**: `apps/web/src/routes/_public/ratings/index.tsx:55-73,115-116`
- **Problem**: the loader awaits `clubs.list` and `locations.list` (up to 500 rows each) so that the "Clubes" and "Local" facet menus have options, but the menus are closed on first paint. They add two D1 reads and up to 1,000 rows to the critical path of the most visited data page.
- **Fix**: prefetch them without awaiting (`void queryClient.prefetchQuery(...)`) and read them with `useQuery`, or load them when the popover first opens.

#### [x] P2-L14. Manual casts of error and environment shapes

> **Status:** Fixed: `getServerMessage` and `getFieldErrors` in `lib/errors.ts` replace the hand-written shapes; the optional Turnstile and purge bindings are declared in `packages/env/env.d.ts`, so the two `env` casts are gone.

- **Severity**: Low
- **Location**: `apps/web/src/lib/rating-import-feedback.ts:8-9`, `apps/web/src/components/player/update-request-form.tsx:67`, `apps/web/src/lib/errors.ts:41,49,62,84` (the `AppError` shape is cast, not derived); `packages/api/src/http/turnstile.ts:6`, `packages/api/src/routers/cache.ts:8` (`env as PurgeEnv`)
- **Problem**: three places re-declare the tRPC error shape by hand, and two cast `env` because the optional bindings in `alchemy.run.ts` are added with `...(cond ? { X } : {})` and so do not appear in the inferred `Env` type. A rename of `userMessage` or `zodError` would not be caught by the compiler.
- **Fix**: type errors as `TRPCClientErrorLike<AppRouter>` once in `lib/errors.ts` and import its helpers; declare the optional bindings in `env.d.ts` as `TURNSTILE_SECRET_KEY?: string`, `CLOUDFLARE_CACHE_PURGE_TOKEN?: string`.

---

### Nitpick

- [x] **P2-N1. `motion` is a dependency that does nothing.** `apps/web/src/routes/__root.tsx:10,111` wraps the app in `MotionConfig`, but no component uses `motion` (the one `motion-reduce` in `import-progress.tsx` is a Tailwind class). The wrapper costs about 1 KB gzip (measured) and the package is declared twice (root and `apps/web`). Remove both. — *Fixed: `MotionConfig` and the `motion` dependency are gone.*
- [ ] **P2-N2. Doc-style comments against the project rule.** `AGENTS.md` asks for "zero comments by default" and no doc-style prose, yet there are 149 `/** … */` blocks in `apps/web/src` and `packages/*/src` (most in `data-table-row-actions.tsx`, `form-layout.tsx`, `tournament-import.ts`, `seo.ts`, `entity-pages.tsx`). The header of `hooks/use-rating-import.ts` ("The plan stays in memory so failed or unrun rows can be retried…") is also out of date since the Phase 1 fix persists progress in `localStorage`. — *Partly done: the stale header of `use-rating-import.ts` is fixed. The other 148 doc-style blocks were left; removing them is a style pass of its own.*
- [x] **P2-N3. `AGENTS.md` describes a directory that does not exist.** Line 3 says `source-project/` holds the old codebase; the directory is not in the repository. Remove the sentence. — *Fixed: the sentence is removed from `AGENTS.md`.*
- [x] **P2-N4. `.wrangler` state is tracked.** Six files under `apps/fumadocs/.wrangler/state/` (SQLite metadata, 96 KB) are committed; `apps/fumadocs/.gitignore` lacks `.wrangler/`. `git rm --cached` them and add the ignore. — *Fixed: the six files are untracked and `apps/fumadocs/.gitignore` ignores `.wrangler/`.*
- [ ] **P2-N5. Local build outputs hold production secret values.** `apps/web/.alchemy/local/wrangler.jsonc` and `apps/web/dist/server/wrangler.json` (both gitignored) list the GitHub OAuth client secret, the auth secret and the Turnstile secret as plain `vars`. They are not committed, but a `wrangler deploy` from `dist/` would store them as visible variables instead of secrets, and the files sit unencrypted on the developer's disk. Generate the local config from `.env` (dev) values only, and rotate the secrets if either file was ever shared or backed up. — *Documented only: `operations/local-development.mdx` now warns about the two generated files. The generation itself is Alchemy's, and the secrets should be rotated if either file was shared.*
- [x] **P2-N6. Naming drift in routers.** `insigniaRouter` (singular) next to `insigniasRouter`-style names, `titledPlayers` / `topPlayers` / `swissManager` as top-level routers for single procedures, and `tv-sergipe/-constants.ts` exporting unused labels. Pick one convention in `routers/index.ts`. — *Fixed for `insigniaRouter` → `insigniasRouter`; the single-procedure routers keep their names.*
- [x] **P2-N7. Two hand-rolled debounces next to an installed library.** `components/header/command-menu.tsx:137-145` and `components/form/searchable-select.tsx` each implement `setTimeout` debouncing while `@tanstack/react-pacer` sits unused in `package.json` (P2-L9). Use one `useDebouncedValue`. — *Fixed: `hooks/use-debounced-value.ts` replaces both hand-rolled debounces; `@tanstack/react-pacer` is removed.*
- [ ] **P2-N8. Admin lists repeat a little boilerplate.** `clubs/index.tsx`, `locations/index.tsx`, `roles/index.tsx` and the other simple lists differ only in labels and columns; `EntityListPage` already removes most of it, and a `useEntityDelete(noun, router)` hook would remove the rest. Do it only if a new list is added. — *Left as is, as the finding says: nothing to do until a new list is added.*
- [x] **P2-N9. Date used in render on an admin page.** `routes/_auth/dashboard/update-requests/index.tsx:93` calls `Date.now()` during render; the page is server-rendered, so a row that crosses the age cutoff between server and client render would hydrate differently. Compute it in the loader or an effect. — *Fixed: the count is computed in an effect.*
- [x] **P2-N10. `apps/web/src/components/ratings-archive/format.ts` and `lib/search-schemas.ts:82`** are covered by P2-M5; listed here so they are not forgotten if that finding is resolved by restoring the routes (they would then need tests). — *Moot: the ratings archive code was removed (P2-M5).*

---

### Checked and found sound

- **Loaders and suspense queries**: every public route that uses `useSuspenseQuery` primes the same queries in its `loader` (the counts match route by route; the profile page awaits all of them with `Promise.all`, and `clubs.leaderboard` waits for the player so a 404 does not carry it). Search params are validated with `validateSearch` and feed `loaderDeps`.
- **Code splitting**: the client has 288 chunks; `xlsx` (481 KB raw, 159 KB gzip) and the chart libraries load only on the pages that use them; devtools and the OG renderer are absent from the production client (tree-shaken or lazily imported).
- **Caching of what is cached**: the procedure policy table, the sitemap and RSS Cache API entries, the immutable `/api/media/*` responses with ETag, and the 5-minute public API are consistent with one another; the authenticated bypass is correct.
- **Type discipline**: no `@ts-ignore`, no `as any`, one `as unknown as` (the SheetJS workbook), two `any` (`seed.ts`, `env/web.ts`), no TODO or FIXME. Non-null assertions (about 180) cluster in `gamification/badges.ts`, `seed.ts` and `create-dialogs.tsx`, where the values are checked a few lines earlier.
- **Layering**: `packages/api` has no React or browser imports; the web app only imports pure modules from it (`rating-types`, `circuit-types`, `age-groups`, `link-icons`, `gamification/*` types and constants) plus the HTTP handlers from server routes. The admin lists, forms and delete dialogs are built from shared components (`EntityListPage`, `EntityForm`, `DeleteDialog`), as `AGENTS.md` prescribes.
- **Fonts and CSS**: one CSS file of 38 KB gzip; JetBrains Mono's extra scripts are `unicode-range` subsets and load only if used.
