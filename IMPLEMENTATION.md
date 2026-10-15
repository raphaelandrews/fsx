# FSX Implementation Plan

The next features and improvements, in the order that makes each one cheaper than the last. Every
phase builds only on earlier ones, and each task is small enough to ship on its own.

## How to use this file

- Status lives only in the checkboxes. A phase is done when all its tasks are checked; then its
  heading gets **(done)**. Do not keep a second status list.
- Every task follows the checklist in `AGENTS.md` ("Making a change"): schema, procedure,
  invalidation, route and UI, tests, docs, verify. Docs are English; the public site is Portuguese;
  the dashboard is English.
- A task that needs a decision before work starts says **Decision needed** and sits in
  *Open decisions* at the end until someone answers it.
- New migrations are generated with `bun run db:generate` and applied by `bun dev` (Alchemy), never
  by hand against the local SQLite file.

## Decisions already made

- **Placements from the rating import: no.** Decided: the rating-update sheet has no final rank column and
  the idea is dropped for good.
- **Only the birth year is stored.** `players.birth_year` replaced `birth_date` (migration 0043 keeps the
  year of every existing date). The public API and the Swiss Manager export carry the year; the export
  writes it as `YYYY-00-00` because Swiss Manager requires a full date.
- **The update form does not ask for a nickname.** Only administrators set it.
- **The project runs on the Workers Paid plan.** Heavier work per request is now allowed (a much higher
  CPU limit per request, and far larger D1 monthly quotas than the free daily ones). The stored
  computations (ADR 0008) stay: they are still faster and cheaper than recomputing on each request.
  Phase 1 updates the docs that still assume the free plan.
- **Dynamic share images are rendered on demand and cached in R2** (Phase 6), not pre-generated for
  every record.
- **Out of scope, by choice:** email or any other notifications, an offline-capable PWA, and FIDE or CBX
  linking (neither link-outs nor imported ratings).
- **RSS and the update-request form are already shipped** (Phase 0).

---

## Phase 0: Shipped

- [x] **RSS feed.** `/rss.xml` carries the latest 20 posts and 20 announcements, announced in every
  page's `<head>` and linked from the footer icons. One edge-cached query per ten minutes per data
  center. Code: `packages/api/src/http/feeds.ts`, `apps/web/src/lib/feeds.ts`.
- [x] **Update requests (verified self-service), v1.** A public form at `/atualizar-cadastro` stores a
  proposal; an administrator reviews it under Players → Update requests and approves (applies the fields
  and verifies the player, atomically), rejects, or deletes it. Bounded by consent, a honeypot field, 3
  open requests per player, 300 overall, and the per-IP mutation limit. Migration `0037` creates
  `player_update_requests`; migrations 0037 to 0044 are not applied until `bun dev` runs.

---

## Phase 1: Housekeeping and quick wins

Small, independent, and they make the later phases cleaner.

- [x] **1.1 Reflect the paid plan in the docs and comments.**
  - Add a short ADR ("Workers Paid plan") listing what it changes: CPU time per request, D1 quotas, Worker
    size limit, and that nothing about caching or stored computations is reversed.
  - Update the free-plan wording in ADR 0005 and ADR 0008, `reference/gamification.mdx` (the OG image
    deferral), `operations/query-cost-baseline.mdx`, and the comments in `gamification/computed.ts`,
    `routers/records.ts`, `http/security.ts` and `schema/computed-results.ts`.
  - Done when no file calls the free plan a current constraint and the new ADR is linked from the
    architecture index.
- [x] **1.2 Show pending update requests in the sidebar.** Put the pending count as a badge on the "Update
  requests" item (the dashboard card already has it), so the owner sees it without opening the dashboard. Done when the
  badge appears and clears after reviewing, with an e2e check.
- [x] **1.3 Update-request hardening.**
  - **Retention:** "Delete old decisions" on the requests page clears approved and rejected requests decided
    more than 90 days ago (`playerRequests.deleteReviewed`), contact details included. Pending requests are
    never touched.
  - **Turnstile, opt-in:** with `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` set (see
    `apps/web/.env.example`) the form shows the challenge and the server refuses any token Cloudflare does
    not confirm; the CSP allows Cloudflare's script and frame only then. With neither set, nothing changes.
    **To switch it on**, create a Turnstile widget and add both values to `apps/web/.env.common`.
- [ ] **1.4 Formatting baseline.** Run `oxfmt` over the repository as one dedicated commit (about 500
  files differ today), then keep `bun run check` in the pre-commit hook from there on. Do this between
  phases, never inside one, so it does not bury a feature's diff. **Blocked until the work in progress is
  committed**: `bunx oxfmt --write .` rewrites hundreds of files, and today they are mixed in with all the
  uncommitted changes. (The pre-commit hook already formats the files each commit touches.)

---

## Phase 2: Public tournaments (`/torneios`) (done)

The biggest gap: 173 tournaments with podiums and rating results exist, but visitors can only reach
them through player profiles. This phase also gives search engines one page per tournament.

- [x] **2.1 API.**
  - `tournaments.page`: public, paginated (12 per page), filters by year, `tier`, `rating_type` and
    `championship`, newest first, with the podium's winner for each row. Explicit `columns`, bounded `limit`.
  - Extend `tournaments.byId` (or add `tournaments.results`) with the rating results: player id and name,
    rating before, variation. Cap at 500 rows and say so in the response size monitor.
  - Add `PROCEDURE_CACHE_POLICY` entries (120 s) and integration tests, including `NOT_FOUND`.
- [x] **2.2 Routes and UI.** `routes/_public/torneios/{route,index,$id}.tsx` (the directory pattern from
  `AGENTS.md`), URL filters through `lib/search-schemas.ts` with `.catch` fallbacks, loaders that prefetch
  what they suspend on. The detail page shows: podium (overall, then per category), a results table
  (`DataTable`, sortable by variation), the Chess-Results link, and breadcrumbs to the championship or
  circuit.
- [x] **2.3 SEO and checks.** Unique titles and descriptions, `SportsEvent` JSON-LD, sitemap entries
  (`getSitemapEntries` gets tournament ids), `check-ssr.ts` budgets, and the a11y e2e list.
- [x] **2.4 Cross-links.** From the profile's tournament history, the champions gallery, and circuit
  stages to the tournament page. Done when each of those rows links and an e2e test follows one.
- [x] **2.5 Docs.** Routes and procedures catalogs, the home/guide pages, the nav and footer.

---

## Phase 3: Calendar (`/calendario`) and iCal

Replaces the Google Sheet the navigation links to today.

- [x] **3.1 Schema.** Add nullable `end_date`, `venue` and `venue_url` (a label and a link; `location_id` was
  skipped) to `events`. These are plain `ALTER TABLE ADD COLUMN`s, safe on D1. Extend the admin event form and
  `lib/admin-forms.ts`.
- [x] **3.2 API.** `events.calendar` (public): events for a month or a year, with their links, at most 200
  rows; cache policy entry; tests.
- [x] **3.3 Page.** `/calendario`: month navigation through search params, events grouped by month,
  registration and results links as on the home cards, "past" styling for finished events. Link
  upcoming events to a tournament page once Phase 2 exists and the event is tied to a tournament
  (optional `tournament_id` on events).
- [x] **3.4 iCal feed: removed on request.** The calendar shows only the current year and has no
  subscription.
- [ ] **3.5 Cut over.** Navigation, FAQ and the page point at `/calendario`, and the old sheet is linked at the bottom for
  a month. Remaining: the federation enters the events (name, dates, venue and venue link, links).

---

## Phase 4: Rating history and lists (done)

Uses `ranking_snapshots`, which already stores every active player's position and rating at each import.

- [x] **4.1 Position over time on the profile.** `players.rankingHistory` (public): up to 60 points per
  format, newest last. A small line chart under the rating boxes (the chart helpers in
  `components/player/player-charts.tsx`), with the same keyboard and screen reader treatment as the
  rating chart. Hidden until a player has two points.
- [x] **4.2 Rating list archive.** `ratings.lists` (the available snapshot dates) and
  `ratings.snapshot({ snapshotAt, ratingType, page })` (public, 50 per page, joined to the player's
  name and club). Route `/ratings/lista/<AAAA-MM-DD>` with a date selector on `/ratings`. The archive
  starts at the first recorded snapshot; say so on the page.
- [x] **4.3 Docs and tests.** Procedure rows, ADR 0007 addendum (snapshots are now user-facing), tests
  with two snapshots.

---

## Phase 5: Player comparison (`/comparar`) (done)

- [x] **5.1 API.** `players.compare({ a, b })` (public): both players' stats from the shared stats module,
  tournaments played in common with each side's variation, and medal counts. `NOT_FOUND` for either
  id; `BAD_REQUEST` for the same player twice.
- [x] **5.2 UI.** Two player pickers (`SearchableSelect`), state in the URL (`?a=1&b=2`) so a comparison is
  shareable, side-by-side tiles, a common-tournaments table. Linked from the profile ("Comparar com…")
  (the command menu only searches players, so it was left out).
- [x] **5.3 Checks and docs.** Route in the sitemap exclusions (noindex, user-generated pairs), `check-ssr`
  and a11y entries, routes and procedures catalogs.

---

## Phase 6: Media and sharing (done)

Needs the paid plan for the rendering work (see *Decisions already made*).

- [x] **6.1 Image sizes.** **Cloudflare transformations** (enable Image Transformations for the zone and set
  `VITE_IMAGE_TRANSFORMATIONS=true` in `.env.prod`). `srcset` and explicit dimensions in the ratings avatars, news cards and profile photo,
  with the existing `/api/media` keys as the source of truth. Done when the ratings page transfers
  noticeably less image data (measure with the e2e request budget).
- [x] **6.2 Dynamic share images.**
  - Route `/api/og/<kind>/<id>.png` (players, posts, season recap) rendered with Satori and a WASM PNG
    encoder, fonts bundled with the Worker.
  - Render on the first request, store the PNG in R2 under a key that includes a hash of what the image
    shows (rating, level, medals, title text), serve it with a long `Cache-Control`; a changed hash is a
    new key, so nothing needs purging.
  - Fall back to `/og-image.png` if rendering fails. Wire `buildSeo`'s `image` for profiles, articles and
    the season page.
  - Not built: the season recap page has no share image; it keeps `/og-image.png`.
  - Verify: Worker bundle size stays under the plan limit (`check:bundle`), p95 render time recorded
    with `bun run measure`, and an e2e test fetches one image and checks its dimensions (1200×630).
- [x] **6.3 Photos in update requests.** Add an optional photo to the public form: raster images only
  (reuse `lib/image-validation`), 2 MB, stored under `pending/` in R2 and attached to the request. The
  review page previews it; approving moves it to the player's `players/` key (and removes the previous
  one through `deleteReplacedMedia`); rejecting or deleting the request deletes the object. Add an R2
  lifecycle rule or a cleanup step for abandoned `pending/` objects.

---

## Phase 7: Admin productivity (done)

- [x] **7.1 Change history.** A `change_log` table (actor, entity, record id, action, a JSON diff of the
  changed fields, timestamp) written by a middleware on admin mutations (see ADR 0011): after the change rather than inside its batch, and rating results excluded because they keep their own trail. A "History" section on the player and
  tournament edit pages and a `/dashboard/history` list with filters. Define retention (for example 2
  years) and add it to the privacy page. Rating history keeps its own, stricter audit trail.
- [x] **7.2 Bulk actions.** A selection column in `DataTable`, then bulk deactivate or activate players,
  assign a club, delete podiums. One batch procedure per action (bounded to 200 ids), confirmed through
  `DeleteDialog` with the record count, with the invalidation map updated.
- [x] **7.3 News drafts and scheduled publishing.** A nullable `publish_at` on `posts`; public queries
  filter on `published AND (publish_at IS NULL OR publish_at <= now)` so no cron is needed. An admin
  preview route renders a draft exactly as published. Done when a scheduled post appears at its time
  within the edge TTL (document the delay) and stays out of the feed and sitemap until then.
- [x] **7.4 One-file tournament import.** An extra sheet type for `/rating-update`: tournament metadata,
  podium and rating results in one file, reviewed and applied in order (tournament, results, podiums).
  Reuses the upload, review, import and report components from the rating-update flow.

---

## Open decisions

| Decision | Needed by | Notes |
| --- | --- | --- |
| Switch Turnstile on for the update form | Optional | Built and off by default (task 1.3). Needs a site key and secret from Cloudflare; free. It is a bot check (the "I am human" widget) on the public form. |

## Not planned

- Deriving *defending champions* automatically, head-to-head for cups, and reworking insignias remain
  deferred in `reference/gamification.mdx`; revisit them now that Phase 5 has built the comparison
  tooling they would use.
- Notifications (email, digests, owner alerts), an offline PWA, and FIDE or CBX linking were considered and
  deliberately left out.
