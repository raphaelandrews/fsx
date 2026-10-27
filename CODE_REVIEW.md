# Code review

## Summary

Four phases covered the whole repository: [bugs, security and database](#phase-1-bugs-security-and-database), [performance, architecture and clean code](#phase-2-performance-architecture-and-clean-code), [UX, accessibility and SEO](#phase-3-ux-accessibility-and-seo), and [testing, tooling and docs](#phase-4-testing-tooling-and-docs). Each finding has an ID (`H1`, `M3`, `P2-L5`, `P3-M1`, `P4-M2`) and a checkbox: `[x]` fixed, `[ ]` open.

### Overall assessment

The application code is in good shape for a single-owner site. Every mutation sits behind the administrator check, procedures are bounded and return typed errors, rating arithmetic runs as optimistic-locked batches, uploads are validated by content, and the 530 tests (96 % of lines in the files they load) include D1 integration tests, the public API checked against its OpenAPI document, and a Playwright suite with axe that runs against the built Worker. The 94 findings were mostly of the kind that grows in a feature-rich codebase: limits that did not match D1's, a few accessibility gaps, and duplicated code. Phases 1 to 3 fixed 63 of the 78 findings they raised, including the one High and 19 of the 21 Medium.

What remains is mostly operational, not in the app: how production data is protected and changed (a `destroy` script that can delete the live database, backups that live on one laptop, deploys by hand under the OS user's name), and several guards that cannot fail (the sign-in lock has no test, the CI migration check ignores new files, the import's recovery path is untested). Two open Medium findings are decisions only the federation can make: how much of the players' data is public (`M5`) and whether the HTML should be cached (`P2-M1`).

### Findings per severity

| Severity | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total | Still open |
| -------- | ------- | ------- | ------- | ------- | ----- | ---------- |
| Critical | 0 | 0 | 0 | 0 | 0 | 0 |
| High | 1 | 0 | 0 | 0 | 1 | 0 |
| Medium | 7 | 6 | 8 | 5 | 26 | 4 |
| Low | 12 | 14 | 11 | 8 | 45 | 9 |
| Nitpick | 5 | 10 | 4 | 3 | 22 | 9 |
| **Total** | 25 | 30 | 23 | 16 | **94** | **22** |

Phase 4 was written report-only; 9 of its 16 findings were fixed afterwards (`P4-M1`, `M3`, `M4`, `L1`, `L2`, `L3`, `L6`, `L7`, `N2`), so 72 of the 94 are fixed. Six checked-off findings still have a part open: `M3` (set `TURNSTILE_SECRET_KEY` in production), `M6` (a server-side import), `L6` (script nonces), `L7` (a sweeper for uploads that were never saved) and `P3-L4` (links inside table rows are still about 20 px tall), and `P4-L6` (the web app does not extend the base config; the docs site has no type check).

### Top 10 to fix first

IDs link to the phase that holds the finding; the `P4-` ones link to the finding itself.

| # | Finding | Why it is first | Effort |
| - | ------- | --------------- | ------ |
| 1 | [P4-M1](#p4-m1) **(fixed)** `bun run destroy` can delete the production database | One command, no backup on a schedule, no guard in the config | 5 min |
| 2 | [P4-M2](#p4-m2) Backups: one laptop, nothing for the images | A lost laptop or a deleted bucket is unrecoverable for the photos and for any change since the last manual dump | Half a day |
| 3 | [P4-M3](#p4-m3) **(fixed, direct hook tests)** The sign-in lock is untested | It is the only gate to the admin, and it depends on how a library handles a thrown error | 1 h |
| 4 | [P4-M4](#p4-m4) **(fixed)** The CI migration check cannot fail | A schema change without its migration passes CI and breaks the deploy | 2 min |
| 5 | [M3](#phase-1-bugs-security-and-database) (open part): set `TURNSTILE_SECRET_KEY` | Without it the public update form is open to a script that fills the 300 pending slots | 5 min, configuration |
| 6 | [P4-M5](#p4-m5) and [M6](#phase-1-bugs-security-and-database): the rating import's recovery path | A browser-driven import that writes ratings, with an untested resume | 2 h for the test; a server-side import is larger |
| 7 | [M5](#phase-1-bugs-security-and-database): minors' birth years and sex are public | A policy decision; the options are listed in the finding | A decision |
| 8 | [P4-L1](#p4-l1) **(fixed)** The 5-second test timeout | Intermittent red CI runs, seen twice | 2 min |
| 9 | [P4-L3](#p4-l3) and [P4-L2](#p4-l2) **(fixed)**: workflow permissions, unpinned actions, token scope | Supply-chain hygiene around a token that can read the whole database | 30 min |
| 10 | [P4-L8](#p4-l8) Deploys: stage named after the OS user, no pre-deploy backup | A deploy from another machine creates a second set of resources | 1 h |

### Quick wins (under 15 minutes each)

The P4 items and the doc-drift edits below are done; the rest is open.

- **P4-M1**: add `delete: false` to the D1 and R2 resources in `alchemy.run.ts`; drop the root `destroy` script.
- **P4-M4**: replace `git diff --exit-code` with `test -z "$(git status --porcelain -- packages/db/src/migrations)"`.
- **P4-L1**: a root `bunfig.toml` with `[test]` and `timeout = 30000`.
- **P4-L2** and **P4-L3**: move the Cloudflare variables to the backup step, add `permissions: contents: read` to the three workflows, add the `github-actions` ecosystem to Dependabot.
- **P4-L7**: add `/bullet` to `check-ssr.ts` and to `publicPages` in `a11y.e2e.ts`.
- **P4-N1**: read the backup before deleting the local D1; verify `SHA256SUMS` in `verify-d1-backup.sh`.
- **P4-N2**: `git rm --cached` the four `.pyc` files and add `__pycache__/` to `.gitignore`.
- **M3 (configuration)**: set `TURNSTILE_SECRET_KEY` and the matching site key for the production build.
- **Doc drift**: items 1 to 7 and 10 in [Doc/code drift](#phase-4-testing-tooling-and-docs) are one-line edits each (routes and procedures rows, the index list, "22 routes" → 42, `admin-forms.tsx`).
- **P3-N4**: change the Bullet round headers from `h3` to `h4`.
- **P3-L8**: pick one spelling for "Rating"/"Ratings" and "Buscar"/"Procurar" and apply it.

### Things done well (do not "fix" these)

- **One admin gate, enforced on the server.** `adminProcedure` checks the numeric GitHub account id on every call; the UI guard is a convenience. The only public mutation is the update form, and it has caps, a honeypot and optional Turnstile.
- **Typed errors and safe messages.** `normalizeProcedureError` turns database errors into `CONFLICT`, `NOT_FOUND` and `BAD_REQUEST`, 5xx details never reach the client, and every error carries a `userMessage` only for 4xx.
- **Rating arithmetic and multi-statement writes** are single `db.batch` calls with optimistic locking; deletions are blocked by `restrict` foreign keys and explained in a confirm dialog that names what they block.
- **Caching and rate limits.** The per-procedure cache policy, the session-cookie bypass, the per-IP limits and their numbers agree across code, infra and docs. The HTML is not cached on purpose (ADR 0003, `P2-M1`).
- **Uploads.** Server-side allowlist, magic-byte checks, SVG sanitising, UUID keys, a sandboxed media route and a 30-day expiry for pending photos.
- **Tests that mean something.** Failure paths are covered, the public API is compared with its OpenAPI document, e2e runs against the built Worker, and the axe test now also fails on heading order, landmarks and target size.
- **Operational checks that exist.** Runtime pins, the bundle budgets, SSR and SEO checks, the restore drill, the hourly health query and the deploy smoke test are all written and mostly sound; Phase 4 asks for them to be wired up and verified, not rebuilt.
- **Documentation.** The Fumadocs site is accurate to a degree that is unusual: every internal link works and every cached procedure's TTL, every rate limit and every command matches the code. The 16 drift items in Phase 4 are small.
- **Accessibility and SEO basics.** Unique titles, descriptions, canonical URLs, Open Graph and JSON-LD on every public page; Portuguese copy and `America/Maceio` formatting; reduced-motion support; visible focus.

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

Status: items 1 to 11 and 13 to 15 are fixed in the docs, the OpenAPI spec (`404` now declares `Cache-Control`), `CONTRIBUTING.md` and `IMPLEMENTATION.md`; item 12 (the one-off release checklists in the runbook) needs a decision on what to keep and is open; item 16 is left as written.

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

---

## Phase 3: UX, accessibility and SEO

Scope: every route in `apps/web/src/routes` (30 public pages, the login and the step-by-step update form, 48 admin pages, the sitemap, RSS, robots and share-image endpoints) and the components behind them. Findings use the `P3-` prefix and the same `[ ]` / `[x]` convention. Phase 1 and 2 findings are not repeated.

### How it was checked

| Check | Result |
| ----- | ------ |
| axe-core with the WCAG 2.0 / 2.1 / 2.2 A and AA tags plus the `best-practice` rules, on 29 public pages and 35 admin pages, at 375 and 1280 px (scratch Playwright script, built Worker with seeded data) | Before: 18 findings on 8 public pages (target size, contrast, heading order, missing `h1`, landmarks) and, in the dashboard, `region` on all 35 pages plus heading order, target size and a second `h1` in the post preview. After the fixes: none, on both widths |
| Same script: horizontal overflow, headings that skip a level, title of every page | Before: overflow on `/comparar` and `/estatisticas?aba=emblemas` at 375 px; `h1` → `h3` on 5 pages. After: none |
| Server HTML of every public route (status, `<title>`, description, canonical, robots, Open Graph image, JSON-LD, `h1`, `main`, images without `alt`) | All routes have a unique title, a description, a canonical URL, Open Graph and Twitter tags and JSON-LD. Findings below only where something was missing |
| Keyboard probe of the player picker, the first tab stop and the mobile search | Reproduced P3-M1 and P3-M5 |
| Code sweeps: `Intl`/`toLocale*` without `timeZone`, raw palette colors, clickable non-buttons, icon buttons without a label, `outline-none`, English text on public pages, missing accents | One raw-color site (P3-L6); the rest are clean |

Counts: 0 Critical, 0 High, 8 Medium, 11 Low, 4 Nitpick. After the fixes, the verification is `check-types`, `lint`, `bun test` (529 pass; one Miniflare test times out only in the full run, as before), `build`, `check:ssr` (42 routes), `check:routes`, `check:bundle` and the Playwright suite (141 pass, including the new keyboard, skip-link and leave-guard tests and a stricter a11y test).

| Measure | Before | After |
| ------- | ------ | ----- |
| axe rules failing (public + admin, both widths) | 6 distinct rules | 0 |
| Findings checked off | | 16 of 23 (P3-L4 only in part); open: P3-L8 (partly fixed), P3-L10, P3-L11, P3-N1 to P3-N4 |

---

### Medium

#### [x] P3-M1. The player picker (`SearchableSelect`) cannot be used with a keyboard or a screen reader

> **Status:** Fixed: `components/form/searchable-select.tsx` is now an ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, a `listbox` with `option` rows). Arrow keys move, Enter picks, Escape closes; the status line (searching, failed, empty) is a live region. The clear button is a 40 px target with a translated label. Covered by the e2e test "the player picker works from the keyboard"; the existing admin test now finds the field by the `combobox` role.

- **Severity**: Medium
- **Location**: `apps/web/src/components/form/searchable-select.tsx:77-110` (before the fix); used by `/comparar` (both pickers) and by every admin form that picks a player, club or location
- **Problem**: The field was a bare `<input>` with a floating list. It had no `role="combobox"`, no `aria-expanded`/`aria-controls`, and the `cmdk` list was rendered outside the keyboard handling of `Command`, so the arrow keys did nothing. Verified with Playwright: type "Atl", press ArrowDown, then Enter: 10 options visible, none selected, the URL unchanged. A keyboard-only or screen-reader user cannot compare two players or fill a player field in the dashboard. The clear button was 16×16 px (axe `target-size`, serious), labelled in English ("Clear") on a Portuguese page, and had no focus style.
- **Fix**: give the input the combobox attributes, keep an active index, handle ArrowUp/ArrowDown/Enter/Escape on the input, and set `aria-activedescendant` to the active option.

#### [x] P3-M2. `robots.txt` blocks the share images and every uploaded photo

> **Status:** Fixed: `Allow: /api/og/` and `Allow: /api/media/` before `Disallow: /api/` (Google and Bing follow the most specific rule), plus `Disallow: /rating-update`. `packages/api/src/http/robots.test.ts` pins the rules.

- **Severity**: Medium
- **Location**: `apps/web/public/robots.txt:5` (`Disallow: /api/`); `lib/og.ts:55` (`/api/og/...png`), `lib/media-image.ts:1` (`/api/media/`)
- **Problem**: Post and player pages point `og:image` at `/api/og/...`, and every uploaded photo (news covers, player photos, club logos) lives under `/api/media/`. Both are under the disallowed prefix. Crawlers that honor robots for images (Twitter/X, LinkedIn, Google Images, Bing) are told not to fetch them, so link previews can lose their picture and photos are never indexed. Facebook and WhatsApp mostly ignore it, which hides the problem when testing.
- **Fix**: allow the two prefixes before the `Disallow: /api/` line.

#### [x] P3-M3. The home page has no `<h1>`

> **Status:** Fixed: a screen-reader-only `<h1>` with the site name in `routes/_public/index.tsx`. The a11y e2e now fails on `page-has-heading-one`.

- **Severity**: Medium
- **Location**: `apps/web/src/routes/_public/index.tsx:57-70` (`/`); every other public page has exactly one
- **Problem**: Server HTML of `/` has 0 `h1` and 5 `h2` (axe `page-has-heading-one`). Screen reader users navigating by heading, and search engines reading the page outline, get no page title on the most visited page.
- **Fix**: `<h1 className="sr-only">{SITE_NAME}</h1>` as the first child.

#### [x] P3-M4. Section labels are not headings, and five pages skip heading levels

> **Status:** Fixed: `SectionHeading` renders an `h2` (32 uses: profile, season, club, tournament, circuit and record pages); `Subheading` takes `as`; `PostCard` and `PostArticle` take a heading level (`/noticias` and the home hero use `h2`, the admin preview uses `h2`); the Normas Técnicas accordion uses `h2` through `AccordionTrigger headingLevel`; the dashboard column labels are `h2`.

- **Severity**: Medium
- **Location**: `components/section-heading.tsx:16-21` (a `div` and a `span`), `components/noticias/post-card.tsx:57` (`h3` directly under the `h1` on `/noticias`), `components/player/player-charts.tsx:96,159` (chart `h3` with no `h2` above it), `routes/_public/normas-tecnicas.tsx:39` (accordion header is an `h3`), `components/gamification/badge-census.tsx:49-57`, `routes/_auth/dashboard/index.tsx:152`
- **Problem**: The player profile has one `h1` and no `h2` at all: "Ratings", "Evolução", "Conquistas", "Carreira" and the other sections are styled text, so heading navigation on the longest page of the site jumps from the name to a chart title. The same label component builds the club, season, tournament and statistics pages. On `/noticias`, `/normas-tecnicas`, `/estatisticas?aba=emblemas`, `/jogadores/:id` and `/dashboard` the outline goes `h1` → `h3` (axe `heading-order`).
- **Fix**: render the label as `h2` and give the card, accordion and subheading components a level prop; fail the e2e on `heading-order`.

#### [x] P3-M5. There is no skip link

> **Status:** Fixed: `components/skip-link.tsx`, the first tab stop of the public layout and of `/links`, jumping to `main#conteudo` (focusable). Covered by the e2e test "a skip link jumps past the header to the content".

- **Severity**: Medium
- **Location**: `routes/_public/route.tsx:21-24`; first tab stop on `/` is the "Início" link of the header (verified with Playwright)
- **Problem**: A keyboard user tabs through the logo, the navigation menu (4 items with sub-menus), search and the update link on every page before reaching the content (WCAG 2.4.1 Bypass Blocks).
- **Fix**: a visually hidden link that appears on focus and targets `main`.

#### [x] P3-M6. `/bullet`, `/tv-sergipe` and `/comparar` cannot be reached from the site

> **Status:** Fixed: all three are in the "Destaques" menu and the drawer; the footer lists them, plus Calendário and Normas Técnicas, which were also missing.

- **Severity**: Medium
- **Location**: `components/header/header-navigation-data.tsx`, `components/footer.tsx:9-22`
- **Problem**: A search of every component and route for links to these pages finds none for `/bullet` and `/tv-sergipe` (the sitemap lists them), and `/comparar` is linked only from a profile. A visitor looking for the school games or the Bullet championship has nothing to click; the pages exist for people who already have the address. The footer also omitted Calendário and Normas Técnicas, which the header has.
- **Fix**: add them to the navigation data and the footer.

#### [x] P3-M7. Admin edit pages lose unsaved changes silently

> **Status:** Fixed: `AdminForm` takes `dirty` (TanStack Form `isDirty`, wired in the five form components) and mounts `components/admin/leave-guard.tsx`: an `AlertDialog` ("Discard unsaved changes?") for in-app navigation and `beforeunload` for closing the tab. It is off in creation dialogs and is released once Save is pressed, so the redirect after a save is not blocked. Known gap: if client-side validation rejects the Save, the guard stays released until the next edit or server error. Covered by the e2e test "an edit page asks before discarding unsaved changes".

- **Severity**: Medium
- **Location**: `components/admin/form-layout.tsx` (`AdminForm`), all edit pages; the only `beforeunload` in the app is the rating import
- **Problem**: A long post, player or tournament edit is lost by one click on the sidebar, the breadcrumb or the browser's back button. Posts and tournaments are the longest forms in the dashboard.
- **Fix**: block navigation while the form is dirty and confirm.

#### [x] P3-M8. The home FAQ and the verified-profile popover send people to Google Forms, and one of them is mislabeled

> **Status:** Fixed: both link to `/atualizar-cadastro`, the site's own request flow that the header already promotes; the popover button now reads "Atualizar meus dados".

- **Severity**: Medium
- **Location**: `components/home/faq.tsx:52`, `components/player/verified-badge.tsx:103-114`
- **Problem**: The header's "Atualizar cadastro" opens the built-in flow that the administrators review (`/dashboard/update-requests`), but the FAQ answer to "how do I register" tells people to fill an external Google Form, and the popover on a profile that already is verified (board member, referee) offers "Solicitar verificação" to that other form. Two entry points feed two different inboxes, and the second one asks a verified person to request verification.
- **Fix**: one flow; link to it.

---

### Low

#### [x] P3-L1. Horizontal scroll on phones: `/comparar` and `/estatisticas?aba=emblemas`

> **Status:** Fixed: the comparison sections get `min-w-0` (a grid item sized itself to the table's content, 422 px in a 375 px view) and the tier tabs scroll inside their track (`max-w-full overflow-x-auto`, as the champions tabs do).

- **Severity**: Low
- **Location**: `routes/_public/comparar.tsx:84-92`, `components/gamification/badge-census.tsx:36-47`
- **Problem**: At 375 px the document is 434 px and 443 px wide, so the whole page pans sideways. Found by comparing `scrollWidth` with the viewport on every page.
- **Fix**: `min-w-0` on the grid items; let the tab list scroll.

#### [x] P3-L2. Low contrast on the tier count in the emblem tabs

> **Status:** Fixed: the `opacity-70` is gone (`font-medium` instead).

- **Severity**: Low (axe: serious)
- **Location**: `components/gamification/badge-census.tsx:42`
- **Problem**: 12 px text at 70 % opacity on the burple active tab is below 4.5:1.
- **Fix**: full-opacity text.

#### [x] P3-L3. Pages without a `main` landmark

> **Status:** Fixed: `/login` is a `<main>`; the desktop sidebar is an `<aside aria-label="Sidebar">`, so no dashboard content sits outside a landmark (axe `region` was flagged on 35 admin pages).

- **Severity**: Low
- **Location**: `routes/login.tsx:32`, `packages/ui/src/components/sidebar.tsx:240`
- **Problem**: `/login` had no `main` (axe `landmark-one-main`, `region`); the admin sidebar, logo and user menu were outside any landmark.
- **Fix**: use `main` and `aside`.

#### [x] P3-L4. Small touch targets (partly fixed)

> **Status:** Partly fixed: footer links (24 px → 40 px, with a focus style), the footer logo link (16 px → 40 px), the calendar month chips (28 px → 36 px), the season links in the activity graph, the verified badge (20 px → 32 px) and the clear button (16 px → 40 px). Not changed: links inside table rows and lists (20 px tall tournament names on a profile, the player names in the compare table), which meet the WCAG 2.2 AA minimum of 24 px with their spacing but not the 44 px in `DESIGN.md`; making them taller would change every table.

- **Severity**: Low
- **Location**: `components/footer.tsx`, `routes/_public/calendario.tsx:50`, `components/player/player-stats.tsx:54`, `components/player/verified-badge.tsx:77`
- **Problem**: On a phone, the footer's 12 links are 24 px tall with 8 px between them; the month chips are 28 px.
- **Fix**: vertical padding on the links.

#### [x] P3-L5. News article: "..." in the server HTML, no `<time>`, "3 dias" instead of "há 3 dias"

> **Status:** Fixed: the elapsed text appears only after hydration (nothing is rendered before, instead of "..."), reads "há 3 dias / há 2 meses / Hoje", and the date is a `<time dateTime>`.

- **Severity**: Low
- **Location**: `components/noticias/post-time-ago.tsx:30-62`
- **Problem**: The server HTML of every article contains `<p>...</p>` next to the date, which crawlers and no-JS readers see; the date is not machine-readable; and the elapsed label has no "há".
- **Fix**: as above.

#### [x] P3-L6. Raw palette colors against `DESIGN.md`

> **Status:** Fixed: the third-place cell of the Bullet prize table uses `bg-orange-fill text-orange-foreground` (white on `orange-500` was about 3:1, and the template string wrote the literal text `false` into the class list); the dashboard board icons use `text-orange`, `text-blue`, `text-green` and `text-violet`.

- **Severity**: Low
- **Location**: `components/bullet/bullet-client.tsx:340`, `routes/_auth/dashboard/index.tsx:68-103`
- **Problem**: `bg-orange-500 text-white`, `text-amber-500`, `text-sky-500`, `text-emerald-500`, `text-violet-500`: the rule in `DESIGN.md` and `AGENTS.md` is theme tokens only.
- **Fix**: use the color-family tokens.

#### [x] P3-L7. Login: English heading among Portuguese text, and no pending state

> **Status:** Fixed: the heading reads "Entrar" (the page title, text and button already were Portuguese) and the button shows a spinner and ignores a second click until the redirect or an error.

- **Severity**: Low
- **Location**: `routes/login.tsx:35-52`
- **Problem**: "Sign In" above "Entre com sua conta do GitHub…"; double-clicking starts two OAuth redirects.
- **Fix**: as above.

#### [ ] P3-L8. Terminology across the public navigation (partly fixed)

> **Status:** Partly fixed: "Home" is now "Início" in the header and footer, matching the breadcrumbs and JSON-LD. Open: the menu says "Rating" while the page, its title and its URL say "Ratings"; the table controls say "Buscar…" while the search field and command menu say "Procurar…"; and the table text has both "Nenhum resultado encontrado." and "Sem resultados.". These are copy decisions for the federation.

- **Severity**: Low
- **Location**: `components/header/header-navigation-data.tsx:48`, `hooks/use-table-text.ts:17,25`

#### [x] P3-L9. Table search fields have no accessible name

> **Status:** Fixed: `SearchInput` sets `aria-label` from its placeholder.

- **Severity**: Low
- **Location**: `components/data-table/search-input.tsx:46`; `/ratings`, `/titulados`, `/membros`, the dashboard lists
- **Problem**: Only the placeholder named the field, and it disappears once the user types.
- **Fix**: `aria-label`.

#### [ ] P3-L10. 404 pages are titled with the site name and are not `noindex`

> **Status:** Not done: a route `head` does not run when its loader throws `notFound()` (tried on the catch-all route; the title stayed "Federação Sergipana de Xadrez"), so a fix needs the status to be set differently or a title inside `NotFound`, which duplicates the root `<title>`. The status code is already 404, which search engines treat as removal; the visible effect is the browser tab title only.

- **Severity**: Low
- **Location**: `routes/_public/$.tsx`, `components/not-found.tsx`
- **Problem**: `/nao-existe`, `/jogadores/9999` and `/jogadores/abc` answer 404 with `robots: index, follow` and the home title.

#### [ ] P3-L11. A profile for the player with id 1 is hard-coded as the "Diretoria" badge

> **Status:** Not done: it changes what the public sees and needs the federation to say who should have it (a role already exists for that).

- **Severity**: Low
- **Location**: `components/player/verified-badge.tsx:21`
- **Problem**: `if (playerId === 1) return "admin"` ties a red board badge to a database id.
- **Fix**: derive it from the management role.

---

### Nitpick

- [ ] **P3-N1. Footer credits are English** ("Built by", "Source code", `components/footer.tsx:60`). `DESIGN.md` documents them as is; left.
- [ ] **P3-N2. Six hand-written `split("-").reverse().join("/")` date formatters** (`circuit-champions.tsx:13`, `player-charts.tsx:182`, `compare-table.tsx:97`, `import-review.tsx:88`, `schedule.ts:21`) duplicate `formatIsoDate` (`gamification/tier.ts:19`).
- [ ] **P3-N3. The sitemap has `lastmod` only for news.** Players, tournaments, announcements and clubs have `updatedAt`-style data (`lib/sitemap.ts:37-46`).
- [ ] **P3-N4. Bullet round headers are `h3` inside an `h3` group** (`bullet-client.tsx:457`); they should be `h4`.

---

### Checked and found sound

- **SEO**: every public page has a unique `<title>` with the `| FSX` suffix, a description of 63–147 characters (the article and announcement descriptions follow the content), a canonical URL (query strings stripped on `/ratings`, `/comparar`), Open Graph and Twitter tags with a 1200×630 image, and JSON-LD (organization, website, breadcrumbs, and article, person and event types where they fit). Utility pages (`/login`, `/atualizar-cadastro`, `/swiss-manager`, `/comparar`) are `noindex`. The sitemap, RSS and `check-prerendered-seo.mjs` are consistent with the route list, and `check:routes` fails when a public route is missing from the sitemap.
- **Loading, empty and error states**: every route has a skeleton as `pendingComponent` and an error boundary; lists have their own empty text ("Nenhum jogador encontrado.", "Ainda não há torneios cadastrados."); mutations show toasts through `showMutationError`; every admin form has a `loading` Save button, a field error summary that takes focus, and a confirmed `DeleteDialog`.
- **Accessibility basics**: no clickable `div`s, no icon-only button without a name was found, `lang="pt-BR"`, reduced motion honored globally, visible focus rings, the command menu is a labelled dialog, charts have an `aria-label`, avatars and decorative images use `alt=""` correctly, and the existing axe run found nothing serious before this phase.
- **Dates and numbers**: every `Intl` date call passes `timeZone`; numbers use `pt-BR`; the calendar groups by month in `America/Maceio`.
- **Public update form**: step-by-step with a progress indicator, per-step validation, a honeypot, Turnstile, a consent checkbox, a pending submit and a clear summary of what will be sent.

---

## Phase 4: Testing, tooling and docs

Scope: the test suites (`packages/*/src/**/*.test.ts`, `apps/web/e2e`), `.github/workflows`, `scripts/`, `packages/infra`, the lint, format and TypeScript configuration, and every page of `apps/fumadocs/content/docs` plus `README.md`, `AGENTS.md`, `CONTRIBUTING.md` and `IMPLEMENTATION.md`, compared with the code. Read-only; no source file was changed. Findings use the `P4-` prefix and the same `[ ]` / `[x]` convention. Earlier findings are not repeated.

### How it was checked

| Check | Result |
| ----- | ------ |
| `bun test` (full run) | 530 tests, 86 files, 67–70 s. 529 pass and 1 fails with the default 5 s timeout (`admin-mutations.integration.test.ts`, "treats LIKE wildcards literally…", 5.05 s). The file passes alone (4.3 s), and `bun test --timeout 30000` passes 530 of 530. See P4-L1 |
| `bun test --coverage` | 96.5 % of lines and 87.3 % of functions in the files the tests load. Files no test imports are not listed by Bun. Lowest public code: `routers/titled-players.ts` (26 % of lines), `routers/top-players.ts` (0 % of functions), `routers/cups.ts` (50 % of lines); `packages/auth/src/index.ts` lines 57–63 and 77–87 never run (P4-M3) |
| Test quality | 490 test cases; the only two without a direct `expect` call assert through a helper. No `.only`, `.skip`, `.todo` or `.fixme`. Three `waitForTimeout` calls in e2e. No component tests (no `.test.tsx`) |
| `bun audit --audit-level=high` with the three ignores from `quality.yml` | Clean |
| `bunx oxfmt --check` | 619 of 958 files are not formatted (P4-L4) |
| `oxlint` with the React and jsx-a11y plugins switched on, `apps/web/src` and `packages/ui/src` | 59 warnings the current config does not see (P4-L5) |
| `tsc --noEmit --noUncheckedIndexedAccess` in `apps/web` | 30 errors; the flag is off there and on in every package that extends the base config (P4-L6) |
| Procedures: `appRouter._def.procedures` (184) against `procedures.mdx` and `PROCEDURE_CACHE_POLICY` (60 entries) | Every cached procedure's TTL column matches the code. Two public procedures have no row. See the drift list |
| Docs: 58 pages, every internal link and anchor | 0 broken. All 111 `apps/…`, `packages/…` and `scripts/…` paths named in the docs and root files exist (one, `packages/db/src/migrate.ts`, is named only to say it was removed). Every `bun run <script>` the docs mention exists in `package.json` |
| Scripts: `bash -n` on the three shell scripts, a read of every script and workflow | Syntax is fine (`shellcheck` is not installed here). Findings below |
| `check:runtime`, `check:ssr` (42 routes), `lint`, `check-types` | Pass |

Counts: 0 Critical, 0 High, 5 Medium, 8 Low, 3 Nitpick. Nothing is fixed in this phase (report only): 0 of 16 checked off.

---

### Medium

<a id="p4-m1"></a>
#### [x] P4-M1. `bun run destroy` deletes the production database and Worker, and nothing in the config prevents it

> **Status:** Fixed: `delete: false` on the D1 database and the R2 bucket in `alchemy.run.ts`, and the root `destroy` script is gone (the line in `local-development.mdx` too). `alchemy destroy` still exists in `packages/infra` for a throwaway stage, but it now leaves both data resources alone. Not run, since it would touch the live state.

- **Severity**: Medium. **Verified by reading the Alchemy source and the state files; the command was not run.**
- **Location**: `packages/infra/package.json:8` (`"destroy": "alchemy destroy"`), `packages/infra/alchemy.run.ts:17-22` (`D1Database`, no `delete: false`), `:28-48` (`R2Bucket`), `:65` (`TanStackStart`), `apps/fumadocs/content/docs/operations/local-development.mdx:104`
- **Problem**: the stage is `$ALCHEMY_STAGE ?? $USER` (`alchemy/lib/scope.js:24`). On this checkout it is `raphael`, and `packages/infra/.alchemy/fsx/raphael/database.json` and `images.json` hold the production resources `fsx-database-raphael` and `fsx-images`, both created with `adopt: true`. `alchemy destroy` runs `alchemy.run.ts` for that same stage, so one command deletes the D1 database (`delete` defaults to `true`) and the Workers. The R2 bucket delete would fail while it holds objects (`empty` defaults to `false`), but the destroy has already removed the database by then. The docs call the command destructive and say it is never part of a routine deploy; that is the only protection. Backups are manual (P4-M2).
- **Fix**: mark the data resources as not deletable, and take `destroy` out of the root scripts (run it by hand with an explicit `--stage` for a throwaway environment).
  ```ts
  const db = await D1Database("database", { migrationsDir: "…", adopt: true, delete: false });
  const images = await R2Bucket("images", { name: "fsx-images", adopt: true, delete: false });
  ```

<a id="p4-m2"></a>
#### [ ] P4-M2. The only copy of production data outside Cloudflare is a manual backup on one laptop, and the images are not backed up at all

- **Severity**: Medium
- **Location**: `scripts/d1-backup.sh:13` (`BACKUP_ROOT` defaults to `$HOME/Backups`), `.github/workflows/restore-drill.yml:3-8` (the dump is discarded on purpose), `apps/fumadocs/content/docs/operations/runbook.mdx:6-13` and `:306-320` ("Pending production checks"), `apps/fumadocs/content/docs/operations/incident-response.mdx:50-53` (D1 Time Travel), `packages/infra/alchemy.run.ts:28-48` (the bucket has lifecycle rules and nothing else)
- **Problem**:
  1. `bun run db:backup` runs when the owner remembers to. There is no schedule, no second location and no alert when the last backup is old. The documented recovery points are that file and D1 Time Travel.
  2. The monthly `Restore drill` workflow proves that a dump restores, then throws the dump away. It is a rehearsal, not a recovery point.
  3. Nothing copies `fsx-images` (player photos, post images, club logos and flags). D1 Time Travel is a D1 feature, so a deleted object, an overwritten file, or a deleted bucket (P4-M1) cannot be undone. The runbook's media section only says to compare R2 keys with the table columns.
  4. The runbook's "Pending production checks" still list as open: run the restore drill once on a production backup ("by adding the `Restore drill` workflow secrets") and run the `Production health` query against live analytics ("it has not run against production yet"). Repository secrets are not visible from here, so whether either workflow has ever succeeded is unconfirmed.
- **Fix**: add a weekly workflow that runs `db:backup` and uploads the dump, encrypted, to storage in another account (for example a second R2 bucket with its own token); mirror `fsx-images` there too (`rclone sync`). Tick the two pending checks and record the date of the last successful drill in the runbook. Alert when the newest off-site backup is older than 8 days.

<a id="p4-m3"></a>
#### [x] P4-M3. The sign-in lock, the single gate to the admin, is not tested

> **Status:** Fixed: `packages/api/src/auth-sign-in.test.ts` calls the real `mapProfileToUser` and `user.create.before` for the owner, another account, an https URL with no `GITHUB_USER_ID`, and the login rule. It does not run Better Auth's handler with GitHub stubbed, so how the library turns the thrown `APIError` into a response is still untested.

- **Severity**: Medium. **Verified with `bun test --coverage` and by reading the tests.**
- **Location**: `packages/auth/src/index.ts:57-66` (`mapProfileToUser`, `disableSignUp`) and `:77-87` (`databaseHooks.user.create.before`); tests: `packages/auth/src/owner.test.ts`, `packages/api/src/auth-instance.test.ts`, `apps/web/e2e/public.e2e.ts:88-98`
- **Problem**: `owner.test.ts` tests the pure rule functions, `auth-instance.test.ts` only checks that `createAuth()` returns one instance, and the e2e test stops at the redirect to GitHub's authorize URL. Coverage confirms that the `mapProfileToUser` body and the `user.create.before` hook never execute in any test. Phase 1 listed "Sign-in lock: `mapProfileToUser` rejects a non-owner before any user row is created" as sound, from reading the code. Nothing keeps it that way: the comment in the file says a `false` from an account hook would still create the user and a session, so how Better Auth (pinned `1.7.7`, bumped by Dependabot) propagates a thrown `APIError` is a behavior this project relies on and does not test. M4 in Phase 1 was also closed with "no automated test".
- **Fix**: add a test that calls the real handler with GitHub's token and profile endpoints stubbed (`fetch` mock), for three cases: the owner's id signs in; another id gets 403 and no `user`, `account` or `session` row; an `https://` `BETTER_AUTH_URL` with an empty `GITHUB_USER_ID` refuses everyone. A cheaper first step is to call `createAuth().options.socialProviders.github.mapProfileToUser` directly for the same cases.

<a id="p4-m4"></a>
#### [x] P4-M4. The CI check for a missing migration cannot fail

> **Status:** Fixed: `quality.yml` uses `test -z "$(git status --porcelain -- packages/db/src/migrations)"`.

- **Severity**: Medium. **Verified in a scratch repository.**
- **Location**: `.github/workflows/quality.yml:28-31`
- **Problem**: the step runs `bun run db:generate` and then `git diff --exit-code -- packages/db/src/migrations`. When someone changes a schema file and forgets to commit the migration, `db:generate` creates a new, untracked `NNNN_*.sql` and snapshot, and `git diff` ignores untracked files. In the scratch repo, a committed `m/0000.sql` plus a new untracked `m/0001.sql` gives `git diff --exit-code -- m` exit code 0. The check therefore only catches an edited, already-tracked migration. The case `CONTRIBUTING.md` asks for ("schema changes must include the generated Drizzle migration") passes CI and fails in production.
- **Fix**:
  ```yaml
  - name: Validate generated database migrations
    run: |
      bun run db:generate
      test -z "$(git status --porcelain -- packages/db/src/migrations)"
  ```

<a id="p4-m5"></a>
#### [ ] P4-M5. The rating import's recovery path (Phase 1, M6) has no test

- **Severity**: Medium
- **Location**: `apps/web/src/hooks/use-rating-import.ts:40-71` (`RESUME_KEY`, saved progress), `:397` (`resume`), `apps/web/e2e/dashboard-crud.e2e.ts:406-439` (the only import test), `apps/web/src/lib/rating-import.test.ts` (parsing only)
- **Problem**: the M6 fix stores the tournament id, created players and finished rows in `localStorage`, so that uploading the same file again after a crash continues instead of failing on the unique tournament name or creating players twice. The e2e test applies a whole sheet and checks the report after a reload; it never interrupts a run. Nothing exercises "stop after row N, reload, upload the same file, apply only the rest". It is a 447-line hook that writes production ratings, and the logic that decides what has already been applied is the part most likely to break silently.
- **Fix**: an e2e test that aborts the second `players.create`/`linkWithRating` request with `page.route`, reloads, re-uploads the same workbook, and expects each row applied exactly once and no duplicate player. Or move the "which rows are done" bookkeeping into a pure function and unit-test it.

---

### Low

<a id="p4-l1"></a>
#### [x] P4-L1. `bun test` runs with Bun's 5-second timeout, and the heaviest integration tests are close to it

> **Status:** Fixed: root `bunfig.toml` with `timeout = 30000`; the full run passes 537 of 537.

- **Severity**: Low (an intermittent red CI run)
- **Location**: no `bunfig.toml` in the repository; `packages/api/src/admin-mutations.integration.test.ts` ("treats LIKE wildcards literally and validates age groups and birth years")
- **Problem**: every integration file starts its own Miniflare and D1, and several tests run many procedures in a row. In the full run the test above took 5.05 s and failed; the file alone takes 4.3 s in total, and the full suite passes 530 of 530 with `--timeout 30000`. The same one-off timeout was seen during Phase 3. GitHub's shared runners are slower than this machine. CI retries only Playwright, so a timeout fails the whole job.
- **Fix**: a root `bunfig.toml` with `[test]` and `timeout = 30000`.

<a id="p4-l2"></a>
#### [x] P4-L2. The restore-drill job gives the Cloudflare token to every step, including `bun install`

> **Status:** Fixed: the token and account id are set on the `db:backup` step only.

- **Severity**: Low
- **Location**: `.github/workflows/restore-drill.yml:22-25` (job-level `env`), `:31-34`
- **Problem**: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are job-level, so `bun install --frozen-lockfile` (which runs dependency install scripts) and `bun run build` can read them. The token is read-only (D1:Read), but it reads the whole production database, including the OAuth `account` and `session` tables.
- **Fix**: move the two variables to the `bun run db:backup` step. Add `permissions: contents: read` at the top of the workflow.

<a id="p4-l3"></a>
#### [x] P4-L3. Workflow hardening: no `permissions`, tag-pinned actions, and Dependabot ignores Actions

> **Status:** Fixed: `permissions: contents: read` on all three workflows, actions pinned to commit SHAs (with the tag in a comment), `github-actions` added to Dependabot, and the bun cache and Playwright browsers cached in `quality.yml`. e2e is still in the same job.

- **Severity**: Low
- **Location**: `.github/workflows/quality.yml`, `restore-drill.yml`, `production-health.yml` (no `permissions:` key); `quality.yml:17,44` and the other `uses:` lines (`actions/checkout@v4`, `oven-sh/setup-bun@v2`, `actions/upload-artifact@v4`); `.github/dependabot.yml` (only the `bun` ecosystem)
- **Problem**: without a `permissions` block the `GITHUB_TOKEN` gets the repository's default, which is read and write on repositories created before 2023 unless changed. Actions are referenced by movable tags, and Dependabot is not configured to update them. `quality.yml` is one job of 19 steps with no cache for `~/.bun/install/cache` or the Playwright browser (a download on every run), and e2e shares the 25-minute budget with everything before it.
- **Fix**: `permissions: contents: read` on each workflow; pin the three actions to commit SHAs and add `package-ecosystem: github-actions` to Dependabot; cache the two directories; consider moving e2e to its own job with `needs: quality`.

<a id="p4-l4"></a>
#### [ ] P4-L4. Formatting is not enforced anywhere

- **Severity**: Low
- **Location**: `package.json:34` (`"check": "oxlint && oxfmt --write"`), `.github/workflows/quality.yml` (no format step), `vite.config.ts:35-44` (`staged`), `IMPLEMENTATION.md` task 1.4
- **Problem**: `bunx oxfmt --check` lists 619 of 958 files (task 1.4 says "about 500"). The pre-commit hook formats only the files a commit touches, CI does not check formatting, and `bun run check`, which reads like a read-only gate, rewrites files. Diffs mix real changes with reformatting, and the number grows with every unformatted commit.
- **Fix**: do the dedicated format commit that 1.4 describes, then run `vp fmt --check` in CI and rename or split `check` so the name matches what it does.

<a id="p4-l5"></a>
#### [ ] P4-L5. Lint runs only the `correctness` category and leaves the React and accessibility rules off

- **Severity**: Low
- **Location**: `.oxlintrc.json` (`plugins`: `typescript`, `unicorn`, `oxc`; `categories.correctness`), `vite.config.ts:19-22` (`typeAware: false`)
- **Problem**: this is a React app whose Phase 3 findings were mostly accessibility, yet `react`, `react-hooks` and `jsx-a11y` are not enabled. Running `oxlint --react-plugin --jsx-a11y-plugin` over `apps/web/src` and `packages/ui/src` gives 59 warnings: 13 `set-state-in-effect`, 11 `prefer-tag-over-role`, 6 `label-has-associated-control` (`delete-dialog.tsx:123`, `reject-request-dialog.tsx:35`, `tv-sergipe-bulk.tsx:117`), 5 `incompatible-library`, 4 `no-noninteractive-element-interactions`, 3 each of `refs`, `preserve-manual-memoization`, `no-autofocus` and `img-redundant-alt`, 2 `exhaustive-deps` (`use-rating-import.ts:177`, `searchable-select.tsx:99`), and a few single hits. Some are noise (`prefer-tag-over-role` on `role="status"`). The warnings were not checked one by one; they are candidates. Type-aware rules (`no-floating-promises`) are also off.
- **Fix**: enable `react`, `react-hooks` and `jsx-a11y`, set the useful rules (`label-has-associated-control`, `exhaustive-deps`, `no-autofocus`, `img-redundant-alt`) to `error`, fix or disable the rest, and try `typeAware` once for floating promises.

<a id="p4-l6"></a>
#### [x] P4-L6. Type checking has gaps: the web app is looser than the packages, and infra and docs are not checked

> **Status:** Partly fixed: `apps/web` now has `noUncheckedIndexedAccess` (the 30 errors fixed in five files) and `packages/infra` has a `tsconfig.json` and a `check-types` script. `apps/web` still does not extend the base config, and the docs site has no type check.

- **Severity**: Low
- **Location**: `apps/web/tsconfig.json` (no `extends`), `packages/config/tsconfig.base.json:13`, `packages/infra` (no `tsconfig.json`, no `check-types` script), `apps/fumadocs/package.json:6-13` (no `check-types` or `astro check`)
- **Problem**: every package extends `@fsx/config/tsconfig.base.json` and gets `noUncheckedIndexedAccess`, `verbatimModuleSyntax` and `isolatedModules`; `apps/web`, the biggest codebase, has its own config without them. Turning on `noUncheckedIndexedAccess` there produces 30 errors (measured, nothing changed). `packages/infra/alchemy.run.ts` is only type-checked because `packages/env/env.d.ts` imports it, and `alchemy.deploy.ts`, the production entry point, is checked by nothing. The docs site's TypeScript and MDX components have no type check.
- **Fix**: extend the base in `apps/web` and fix the 30 sites; add a `tsconfig.json` and `check-types` to `packages/infra`; add `astro check` to the docs build.

<a id="p4-l7"></a>
#### [x] P4-L7. `/bullet` is in no automated page check, and three public procedures have no API test

> **Status:** Fixed: `/bullet` is in `check-ssr.ts` and the a11y e2e list (both run green), and `titled-top-players.integration.test.ts` covers `titledPlayers.list` and `topPlayers.list`. `cups` already had its own integration test, which this review had under-counted.

- **Severity**: Low
- **Location**: `apps/web/scripts/check-ssr.ts` and `apps/web/e2e/a11y.e2e.ts:32` (neither mentions `/bullet`; no e2e file does either), `packages/api/src/routers/cups.ts:19-96` (`list`, `byId`), `routers/titled-players.ts`, `routers/top-players.ts`
- **Problem**: `AGENTS.md` ("Making a change", step 4) asks for new public routes to be registered in the sitemap, `check-ssr.ts` and the a11y e2e list. `/bullet` is only in the sitemap, so a broken render, a wrong status or a contrast regression there reaches production. The procedures behind `/bullet` (`cups.list`, `cups.byId`), `/titulados` and the home page's top players have no integration test; the coverage report shows 50 % of the lines of `cups.ts`, 26 % of the lines of `titled-players.ts` and none of the functions of `top-players.ts` running. The a11y e2e renders the last two pages, but asserts nothing about their data.
- **Fix**: add `/bullet` to both lists; add one integration test per procedure with a seeded row and an empty case.

<a id="p4-l8"></a>
#### [ ] P4-L8. Production is deployed by hand from one account, named after the OS user, with no gate

- **Severity**: Low
- **Location**: `packages/infra/package.json:7` (`deploy`), `packages/infra/alchemy.run.ts:12` (`alchemy("fsx")`, no `stage`), `scripts/check-production-health.mjs:12` (`fsx-web-raphael`), `scripts/d1-backup.sh:9` (`fsx-database-raphael`), `scripts/deploy-smoke-test.sh:46-48`
- **Problem**:
  1. Resource names come from `$USER` (see P4-M1). Running the deploy from another account, a CI runner or a new laptop creates a second set of resources next to production, because `adopt: true` only matches identical names. The names are also written into two scripts and several docs pages.
  2. Alchemy's state is `packages/infra/.alchemy`, gitignored and encrypted with `ALCHEMY_PASSWORD` from a gitignored file. It exists on one machine and is not mentioned in the backup docs.
  3. `bun run deploy` runs `alchemy deploy` and the smoke test, nothing else: no tests, no pre-deploy backup (the runbook asks for one by hand), and the smoke test skips the media check because the script does not set `MEDIA_SMOKE_URL`.
  4. Dev is `alchemy dev` (local only) and there is a single remote stage, so the runbook's "restore to a separate staging D1" has no configuration behind it.
- **Fix**: set the stage explicitly to the current value (`process.env.ALCHEMY_STAGE ??= "raphael"` in `alchemy.deploy.ts`, so names do not change); document or move the state; make `deploy` take a backup first and set `MEDIA_SMOKE_URL`. If you want CI to deploy, a `workflow_dispatch` job with a protected environment and the same steps does it.

---

### Nitpick

- [ ] **P4-N1. Backup script details.** Partly fixed: `restore-local.ts` now reads the backup before deleting the local D1; the checksum is still not verified. `scripts/d1-backup.sh:72-74` writes `SHA256SUMS`, and `scripts/verify-d1-backup.sh` never reads it, so a dump that changed on disk still verifies. `packages/api/scripts/restore-local.ts:38` deletes the local D1 before `readBackup` (line 50) parses the file, so a mistyped path wipes the dev database first. Read first, then delete; run `sha256sum -c` in the verify script.
- [x] **P4-N2. Python bytecode is tracked.** Fixed: the four files are untracked and `.gitignore` covers `__pycache__/` and `*.pyc`. `scripts/__pycache__/export_d1_csv.cpython-314.pyc` and three files under `.agents/skills/ui-ux-pro-max/scripts/__pycache__/` are in the repository, and `.gitignore` has no `__pycache__` or `*.pyc`. `git rm --cached` them and ignore the pattern.
- [ ] **P4-N3. Three fixed sleeps and one retry in e2e.** `navigation.e2e.ts:118` (500 ms before reading layout shift) and `requests.e2e.ts:60,89` (300 ms before asserting "no further requests") use `waitForTimeout`. They assert that nothing happens, which is the case for waiting, but a request that arrives after 300 ms on a slow runner passes unnoticed. `playwright.config.ts:12` sets `retries: 1` on CI, so a flaky test shows green; the retry is visible only in the report.

---

### Doc/code drift

Every mismatch found, with the page, what it says, and what the code does. All of them were checked against the code; none is changed here.

1. **`reference/routes.mdx`, row `/`**: loader data lists `events.list`. The home loader uses `events.upcoming` and `records.recent` (`routes/_public/index.tsx:30,41`).
2. **`reference/routes.mdx`, row `/jogadores/$id`**: lists `clubs.leaderboard` "after the player resolves". The loader calls `clubs.standing` (`jogadores/$id/index.tsx:22`) and also `players.rankingHistory` (`:20`), which the row omits.
3. **`reference/routes.mdx`, row `/comparar`**: the loader data omits `players.search`, which each picker calls (`comparar.tsx:54`).
4. **`reference/routes.mdx`, `/sitemap.xml` row**: "Static pages, active players, published posts, announcements". `lib/sitemap.ts:42-46` also lists tournaments and clubs.
5. **`reference/procedures.mdx`**: `clubs.standing` and `records.monthHighlight` are public procedures with a 300 s entry in `PROCEDURE_CACHE_POLICY` and have no row.
6. **`reference/database.mdx`, Indexes**: lists `players` indexes on `sex` and on "each rating". Migration `0052` dropped `players_sex_idx`, `players_classic_idx` and `players_blitz_idx`; only `players_rapid_idx` remains. The list also lacks the indexes added by `0051`: `cup_players (player_id)`, `cup_players (cup_group_id)` and `tv_sergipe (player_id)`.
7. **`operations/local-development.mdx:88` and `architecture/rendering-and-caching.mdx:28`**: `check:ssr` "renders 22 routes". It verifies 42.
8. **`reference/public-api.mdx`, last paragraph**: "update … both languages in `openapi.ts`". The file has a single English text table (`const t`).
9. **`reference/public-api.mdx` and `http/openapi.ts`**: the spec's `404` response declares only `Access-Control-Allow-Origin`; the handler also sends `Cache-Control: public, max-age=300` (`public-api.ts:102` and `:121`), and the page says the `404` is cached. The spec does not describe the `OPTIONS` `204` either.
10. **`AGENTS.md:65`, `architecture/code-layout.mdx:65`, `reference/recipes.mdx:37`**: `lib/admin-forms.ts`. The file is `lib/admin-forms.tsx`.
11. **`operations/runbook.mdx`, "Deploy Smoke Test"**: says the test covers media delivery. `bun run deploy` runs it without `MEDIA_SMOKE_URL`, so the script prints "Skipping media check". The "Deploy verification and alerts" section further down says media is checked only when the variable is set; the two paragraphs disagree.
12. **`operations/runbook.mdx`, "Gamification release (one time)" and "Results and categories release (one time)" (lines 88–166)**: one-off steps for migrations 0028–0034 and 0045–0049, including production counts "of 2026-10-25", sit among standing procedures. They describe past deploys, not the current process.
13. **`.github/workflows/production-health.yml:5`**: the header says the alert covers "failed cron cleanups". The cleanup Worker was removed (ADR 0005, migration `0027`), and `alchemy.run.ts` declares no cron trigger.
14. **`CONTRIBUTING.md`**: "Run the repository gates" lists `test`, `check-types`, `lint` and `build`. CI also runs `check:runtime`, `check:bundle`, `check:seo`, `check:routes`, `check:ssr`, the migration check, `bun audit` and `test:e2e` (the full list is in `local-development.mdx`).
15. **`IMPLEMENTATION.md`, task 1.4**: "about 500 files differ today". `oxfmt --check` reports 619 of 958.
16. **Earlier in this file, Phase 1 "Checked and found sound"**: "51 SQL files match 51 journal entries". There are now 53 of each (`0051`, `0052`). The statement was true when written, so it is left as is.

### Checked and found sound

- **CI coverage**: `quality.yml` runs the runtime-pin check, shell syntax checks, the CSV script's Python test, `bun audit`, the migration regeneration (see P4-M4 for its gap), tests, types, lint, build, bundle budgets, prerendered SEO, route-tree and SSR checks, and the Playwright suite with axe, uploading traces on failure. It has a timeout and cancels superseded runs.
- **Pins and drift guards**: `check-runtime-pins.mjs` ties Alchemy, Miniflare, workerd and the compatibility date together, and runs in CI. `migrations.integration.test.ts` guards the foreign-key rule for table rebuilds. `static-headers.test.ts` and `robots.test.ts` pin the static files to the code.
- **Backup and restore scripts**: database name validated against a pattern, `umask 077`, `PRAGMA integrity_check` and `foreign_key_check`, CSV export neutralizes spreadsheet formulas, retention runs only after a successful export, and the drill restores into Miniflare and loads real pages. The drill token is read-only.
- **Smoke test and health check**: the smoke test checks the 401 guard, the 404 status, a public tRPC response and `no-store` on API responses. The hourly health query reports counts only and has thresholds with a minimum request count.
- **Tests**: 530 tests across 86 files with real assertions and failure paths (`NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`, 429, origin and CORS) for the routers, the public API against its OpenAPI document, uploads, rating arithmetic and the cache policy. E2E runs against the built Worker with seeded data.
- **Docs accuracy**: cache TTLs, rate limits (`security.ts`, `alchemy.run.ts` and ADR 0005 agree), session lifetime, the `/api/v1` contract and its field lists, the commands, the environment variables and every internal link match the code.
