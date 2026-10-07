# Gamification Plan

Goal: make player profiles and the public site feel rewarding by surfacing achievements, records,
and progress — derived from data the federation already records, so existing players receive
everything they already qualify for on launch day.

## Principles

1. **Derive, don't store.** Badges, levels, streaks, and records are computed on read from
   `playersToTournaments`, `tournamentPodiums`, `circuitPodiums`, and `playersToTitles`. Nothing is "awarded", so there is no backfill job: past achievements appear
   automatically, and fixing a data error fixes the achievement. New storage only where the data
   cannot be reconstructed (ranking snapshots) or is an official record or judgment (title tier,
   competition tier, final circuit podiums). A correction to the data can therefore remove an
   achievement; that is intended, since corrections fix mistakes. If notifications or permanent
   badges are ever needed, a `player_achievements` table can record first awards from the same
   module.
2. **One definition per concept.** Every derived value (peak, threshold crossing, streak, XP,
   "tournaments played") is defined once, in the pure TypeScript module
   `packages/api/src/gamification/`. The profile, statistics page, feed, and season recap all call it.
   SQL is used only for values whose definition is trivially identical (counts, `MAX`), and a test
   asserts SQL and TypeScript agree on the same fixture.
3. **Every achievement has a provenance.** `{ id, earnedAt: string | null, tournamentId: number | null,
   legacy: boolean }`. `earnedAt` is the source tournament's date, `null` when unknown. `legacy`
   marks achievements earned before the recorded history began (see Data rules). The UI shows
   "Conquista anterior" for legacy and "Data desconhecida" for a missing date — never an invented one.
4. **Whole history, not capped lists.** `players.byId` caps nested collections at
   `PUBLIC_NESTED_COLLECTION_LIMIT` (100). Aggregates come from dedicated queries.
5. **Active vs. all players, per feature.** Features about *the present* (current ranking, club
   strength) use active players. *Historical* features (records, Hall of Fame, all-time medals, the
   feed) include everyone; inactive holders get an "inativo" label.
6. **Code-defined catalogs.** Badge definitions and XP weights live in code: versioned, testable,
   no admin UI.
7. **Every phase follows the AGENTS.md checklist** (schema → procedure → invalidation → route/UI →
   tests → docs → verify). Public UI text is Portuguese; docs are English.

## Decisions

| Topic | Decision |
| --- | --- |
| Norms | Not part of this plan. A norm is a title requirement published on `/normas-tecnicas` (rating reached plus podiums or wins in listed championships); the federation grants the title after the player proves it. The `norms`/`playersToNorms` tables are unused (0 rows) and stay untouched; no norm XP. The unofficial derived title path shipped in Phase 8.6. |
| Announcements | **Done** (migration `0031`). An announcement may name the one player it is about (`announcements.player_id`); the profile lists them under "Comunicados", and the admin edit page suggests players whose full name appears in the text. The Phase 7 feed can use the link. |
| Title weight | New `titles.tier` (1–4) orders emblems and sets title XP, instead of a flat internal/external value (Phase 1.6). |
| Insignias | Out of scope until the insignia model is reworked (see Deferred). |
| Cups | Out of scope: no head-to-head, rivals, cup stats, or cup XP (see Deferred). |
| Active vs. all players | Principle 5. |
| Rating thresholds | 2000 / 2100 / 2200 / 2300 / 2400 — the rating requirements of the title ladder on `/normas-tecnicas` (MMS 2000, MJS 2100, CMS 2200, MSE 2300, GMS 2400), all above the 1900 starting rating. |
| XP weights | Phase 2; distribution checked against production before launch. |
| Records computation | On read through the stats module, behind the edge cache: 8,511 history rows in total is small enough that no precomputed summary is needed. |
| Youngest champion record | Dropped: 64% of players have no birth date, so the record would be wrong. |
| Profile route structure | **Done.** `routes/_public/jogadores/$id/` holds `route.tsx` (validates `idParams`, renders `<Outlet/>`) and `index.tsx` (the profile). Player sub-pages are sibling files and inherit the 404 for invalid ids. |
| Existing data | Retroactive by construction (Principle 1); gaps handled by the Data rules below. |
| Competition data | **Done** (migration `0028`). Tournaments and circuits have a `tier` (`S` Sergipanos, `A`, `B`, `school`). Tournament podiums have an optional `category`, so any tournament — recurring or one-off — can record overall and per-category champions. Circuits are kept per season (`year`, optional championship linking the seasons) instead of being deleted yearly; finishing a season stores its official top 3 per category in `circuit_final_podiums`. |

---

## Existing data

### Audit

`packages/db/src/audits/gamification-readiness.sql` measures every gap the derivations depend on.
Run it read-only against production (pinned Wrangler, as in the runbook):

```bash
apps/web/node_modules/.bin/wrangler d1 execute fsx-database-raphael --remote \
  --command "$(grep -v '^--' packages/db/src/audits/gamification-readiness.sql)"
```

It returns one row per check, the tournament date range, the norms and titles with player counts,
the distribution of peak ratings per format, results per player, circuit podiums by level, and the
tournaments with shared podium places. For the rows behind chain gaps run `rating-history-sync.sql`.

### Production results (2026-10-03)

| Check | Value | Finding |
| --- | --- | --- |
| Players (active) | 5,384 (2,368) | |
| Players with rating history | 2,126 | 362 active players have no results yet: empty states and level 1 must look intentional. |
| Tournaments | 173, from 1972-12-01 to 2026-09-12 | |
| Tournaments without date / bad format | 0 / 0 | Every achievement can be dated. The unknown-date rule stays for robustness only. |
| Tournaments without championship | 99 (57%) | Dynasties are incomplete until admins link championships — the main cleanup item. |
| Tournaments without rating results | 58 | Historical tournaments recorded only through podiums. |
| Rating history rows | 8,511 | Small: the stats module can run on read. |
| Duplicate results / variation > 300 | 0 / 0 | No dedupe or outlier review needed. |
| Rating chains | 2,611 | |
| Chains starting at 1900 | 2,169 (83%) | 1900 is the default starting rating — thresholds at or below 1900 would be free. |
| Chains starting at ≥ 2000 | 119 | History began mid-career for strong players: the legacy rule is needed and visible. |
| Chain gaps / current rating differs | 54 / 4 | Rare; handled by the rules. |
| Date order inversions | 53 | Confirms chains must be ordered by id, not by date. |
| Tournament podiums | 165 | 121 have no rating result (old tournaments): "tournaments played" must include podiums. |
| Shared podium places | 20 | All in the Campeonato Sergipano de Equipes (2015–2026): team members share 1st and 2nd. Not errors. |
| Circuit rows (`circuit_podiums`) | 546, all with place | Despite the name, these are **points rows**, not podiums: one per player per stage (514, 321 of them in a stage's top 3, mostly per category), plus 32 rows for phase-less `geral` circuits. Final standings are not stored — `/circuitos` sums the points (`components/circuitos/aggregate.ts`). |
| Tournament placements | 165 podiums, Sergipano championships only | Other tournaments store only rating results (`oldRating`, `variation`), no placement. |
| Results per player | max 78, average 4.0 | `players.stats` can load a whole career in one query. |
| Peak rating ≥ 2000 / 2100 / 2200 / 2300 / 2400 (rapid) | 169 / 99 / 46 / 21 / 11 of 1,992 chains | Rating badges are prestige: ~9% reach the first step. |
| Peak rating ≥ 2000 (blitz / classic) | 30 of 383 / 18 of 236 | Same pattern in the other formats. |
| Players without birth date | 3,470 (64%) | Age-based records dropped. |
| Titles (internal / external) | 13 / 3, 149 awards | Includes gendered variants and two Honoris Causa titles. |
| Norms / player norms | 0 / 0 | Unused tables; norms are title requirements, out of scope. |


### Data rules

How the derivations treat each case. These are the contract the stats module implements and tests.

| Situation | Rule |
| --- | --- |
| Order of results | A rating chain (one player, one rating type) is ordered by `playersToTournaments.id`, as the rating update writes it. Dates are display and year-bucketing data only; an inversion never reorders a chain. |
| Starting rating | 1900 is the default starting rating. A chain whose first `oldRating` is 1900 started from scratch; thresholds are all above 1900. |
| Chain starts above a threshold | A threshold `T` with `first.oldRating >= T` is earned with `legacy: true`, `earnedAt: null` ("Conquista anterior"). |
| Threshold reached | A threshold `T` is earned exactly when the peak is `>= T`, so a badge never contradicts the peak. Walking the chain in order: a row whose recorded variation crosses `T` (`oldRating < T <= oldRating + variation`) dates it at that tournament; if a row already starts at or above `T` without a crossing (a gap), or only the current rating reaches `T` (a manual edit), it is earned with `earnedAt: null`. |
| Gap in the chain | Streaks and best gain use each row's `variation` as recorded. |
| No rating history | A format with no results and the 1900 starting rating has no stats. A rating above 1900 without history predates the records: its thresholds are legacy. |
| Current rating differs from chain end | Peak = max(every row end, every row `oldRating`, current rating). A peak is never below today's rating. |
| Tournament without date | Counts with `earnedAt: null`; excluded from per-year features and the feed. (None today.) |
| Podium without a rating result | "Tournaments played" = distinct tournament ids across rating history ∪ tournament podiums. |
| Shared podium place | Every player sharing a place gets the medal. Team championships record each team member at the team's place. |
| Tournament placements | Medals come only from recorded podiums (`tournamentPodiums`), overall or per category. Today only Sergipano championships have them, but admins can now record podiums for any tournament. Tournaments without podiums count for participation and rating achievements only; no placement is inferred. |
| Circuit stage results | Each `circuitPodiums` row with `circuitPhaseId` is a stage result. Place 1–3 is a stage medal (with its category); any place still counts as a circuit stage played. A stage medal earns no XP when the same player also has a tournament podium for that stage's tournament. |
| Circuit final podiums | Read from `circuit_final_podiums`, which exist only for finished seasons. They are snapshotted from the summed points when a season is finished (`circuits.finish`, top 3 per category for `categories`/`school` layouts, shared places for ties) and may be corrected by admins, so they are the official record. Seasons in progress give no final medal and no final XP. Circuits deleted before migration `0028` are gone; their champions cannot be recovered. |
| Tier | Every podium inherits the tier of its tournament or circuit, which scales its XP (Phase 2) and lets the trophy cabinet group S-tier titles apart. |
| Tournament without championship | Counts for medals and XP; excluded from dynasties until an admin links the championship. |
| Missing birth date | Not used: age-based records are dropped. |

### Cleanup before launch (admin data entry, not code)

The rules keep the output correct without cleanup; cleanup makes it richer.

1. **Link the 99 tournaments without a championship** — the only gap with a visible effect
   (incomplete dynasties). Start with tournaments that have podiums.
2. Optionally fix the 54 chain gaps and 4 rating mismatches (`rating-history-sync.sql` lists them).
3. After Phase 1.6: set `tier` on each title.

### Launch behavior

- **Retroactive by default:** on release every player sees their full trophy cabinet, badges, and
  level, including podiums back to 1972.
- **The feed starts empty:** it lists only achievements whose source row was recorded after
  `GAMIFICATION_LAUNCH_DATE` (compared to `playersToTournaments.createdAt` / podium `createdAt`).
  Otherwise launch would publish 50 years of history as "news".
- **Ranking movement starts accumulating at Phase 0**, so arrows have data when they are shown.
- **New players are not locked out:** per-year features (season recap, most active of the year,
  best gain of the year) reset annually.
- **Announcement:** a news post linking to the Hall of Fame gives the retroactive trophies a moment.

---

## Phase 0 — Foundations

**Status: done (2026-10-03).** Nothing user-visible ships in this phase. Code: `packages/api/src/gamification/`,
`players.stats`, `playersTournament.snapshotRankings` (migration `0029`), `components/gamification/`,
tier color tokens in `packages/ui`, ADRs 0006 and 0007.

- [x] Stats module: pure functions over a player's results and podiums returning peaks, thresholds (with provenance), streaks, best gain, tournaments played, medal counts, dynasties. Implements every Data rule; unit tests per rule (empty history, single result, chain starting above a threshold, gap over a threshold, current rating above chain end, undated tournament, duplicates, ties). — `packages/api/src/gamification/stats.ts` (+ `.test.ts`)
- [x] Achievement and badge catalog: typed `{ id, label, description, icon, tier, earned(stats) → Achievement[] }`. Tiers: `bronze`/`silver`/`gold`/`platinum`. — `packages/api/src/gamification/badges.ts`
- [x] `GAMIFICATION_LAUNCH_DATE`, rating thresholds, and the XP weights table (Phase 2) as constants. — `packages/api/src/gamification/constants.ts`
- [x] `players.stats` public procedure: loads the player's **full** rating history (explicit columns: `id`, `oldRating`, `variation`, `ratingType`, `createdAt`, tournament `id`/`name`/`date`/`championshipId`), all tournament and circuit podiums; returns stats and achievements (titles and level arrive in Phase 2). Limit 500 results (the current maximum is 78); an integration test asserts a player at the limit still gets correct stats, and the readiness audit's `max_results_per_player` is the number to watch. `requireFound`. — `packages/api/src/routers/players.ts`
- [x] Cache policy for `players.stats`; `ADMIN_QUERY_DEPENDENTS` for rating update, tournaments, tournament podiums, circuit podiums, titles, and player mutations. — `packages/api/src/cache-policy.ts`, `apps/web/src/lib/admin-mutations.ts`
- [x] `rankingSnapshots` table (`playerId`, `ratingType`, `position`, `rating`, `snapshotAt`; `ON DELETE cascade`, index `(playerId, ratingType, snapshotAt)`; leaf table → plain migration). A rating import applies one player per request, so there is no batch covering a whole update: the rating-update page calls `playersTournament.snapshotRankings` once after the import, which writes every active player's position for the imported formats (one `INSERT … SELECT RANK()` per format, in one batch). Shipped now so history accumulates; displayed in Phase 3. — `packages/db/src/schema/`, `packages/api/src/routers/players-tournament.ts`
- [x] UI primitives: `Medal` (1/2/3), `AchievementBadge` (tier colors, locked/unlocked, legacy and unknown-date states, popover with description and date), `StatTile`. Theme tokens only, AA contrast in light and dark. — `apps/web/src/components/gamification/`
- [x] ADRs: "Derived achievements with a code-defined catalog" (Principles 1–3, Data rules) and "Ranking snapshots". — `apps/fumadocs/content/docs/decisions/`

**Done when:** the stats module covers every Data rule with a unit test; `players.stats` has
integration tests for a player with >100 results, a player with no history, and `NOT_FOUND`;
a rating update writes exactly one snapshot per active player and format.

---

## Phase 1 — Profile achievements and title emblems

**Status: done (2026-10-03).** Profile sections in `components/player/` (achievements, stats,
circuits) on `players.stats` and the new `players.circuitSeasons`; title tiers in migration `0030`.
Grouping and filtering podiums by championship ships as grouping only.

- [x] Prefetch `players.stats` in the profile loader with `byId` (`Promise.all`) as the first step:
  it moved here from Phase 0 because prefetching a query nothing renders costs a D1 batch per
  profile view.

### 1.1 Trophy cabinet
- [x] Medal counts above the current "Conquistas" list: 🥇×n 🥈×n 🥉×n, tournaments and circuits counted
  separately (circuit podiums outnumber tournament podiums 3:1 and would otherwise dominate).
- [x] Grouped/filterable by championship. Podiums back to 1972 appear, including tournaments that have
  no rating results.

### 1.2 Rating milestones
- [x] **Peak rating** per format, with tournament and date: "Pico: 2041" in `RatingBox`.
- [x] **Threshold badges** per format at 2000 / 2100 / 2200 / 2300 / 2400, the rating steps of the
  title ladder. Badge copy names the rating, not the title ("2300 no rápido"): reaching the rating
  is one requirement of a title, not the title itself. Only ~9% of players reach 2000, so these
  are prestige badges.
- [x] **Entry-level achievements** for everyone else, since most peaks sit between 1900 and 1999:
  first tournament, first positive result, first podium (Sergipano championship or circuit stage), personal
  best rating.
- [x] **Best performance:** largest single `variation`, linked to the tournament.

### 1.3 Streaks and activity
- [x] Current and best positive streak per format.
- [x] Tournaments played, total and per year; tiered badges at 10 / 25 / 50 / 100.
- [x] "Jogando desde" (first dated result) and number of distinct seasons.

### 1.4 Dynasties
- [x] Wins per championship: "Bicampeão / Tricampeão …"; bonus badge for consecutive-year wins.

### 1.5 Circuits
- [x] "Circuitos" block on the profile: each season the player took part in, with stages played,
  total points, current position while in progress, and final podiums (per category) once
  finished.
- [x] The storage is in place (seasons, `finishedAt`, `circuit_final_podiums`); this phase only reads
  it. `players.stats` loads the player's final podiums and stage results.
- [x] Tests: a season in progress gives no final medal; corrected final podiums win over summed points.

### 1.6 Title emblems

Titles are granted by the federation and already recorded in `playersToTitles`. They need an order
for emblems and XP that the data does not have:

- [x] Schema change below.

| Schema change | Notes |
| --- | --- |
| `titles.tier integer not null default 1` | 1–4, validated in the admin zod schema, **not** a table `CHECK`: a table-level check makes Drizzle rebuild `titles`, which `playersToTitles` references (D1 foreign-key gotcha in AGENTS.md). The generated SQL must be a plain `ALTER TABLE … ADD COLUMN`. |

Suggested tiers, following the rating requirements of the ladder (each title and its feminine
variant share a tier):

| Tier | Titles |
| --- | --- |
| 1 | Mestre Mirim Sergipano/a (2000), Mestre Júnior Sergipano/a (2100) |
| 2 | Mestre Feminina Sergipana (2150), Candidato/a a Mestre Sergipano/a (2200), Candidato a Mestre (CM) |
| 3 | Mestre Sergipano/a (2300), Mestre Sergipano/a Honoris Causa |
| 4 | Grande Mestre Sergipano/a (2400), Mestre Nacional (MN), Mestre Internacional Feminina (WIM) |

External titles are suggestions for the admins to confirm; 149 title awards exist today across the
16 titles.

- [x] Admin: `tier` on the title form (`lib/admin-forms.ts`).
- [x] Profile: held titles show a tier emblem in the header, highest tier first.
- Youth titles are lost the year the player turns 15 (MMS) or 19 (MJS). XP follows the titles the
  player holds now, so it drops when an admin removes an expired title. That is intended: XP
  mirrors the official record.
- [x] Tests: `BAD_REQUEST` for a tier outside 1–4; emblem order by tier.

---

## Phase 2 — Player level (XP)

**Status: done (2026-10-03)**, except running the distribution check on a production backup, which
needs a `bun run db:backup` (see the runbook). `gamification/level.ts`, the level in
`players.stats`, `components/gamification/player-level.tsx`, `packages/api/scripts/xp-distribution.ts`.

Pure function in `gamification/level.ts`, returned by `players.stats`. Every input is a value the
stats module already produces, including legacy achievements — players are credited for their
whole career.

| Source | XP | Rationale |
| --- | --- | --- |
| Tournament played | 15 | Participation is the base; a regular plays 5–15 a year. Was 10 until the production run (2026-10-04). |
| Tournament podium: 1st / 2nd / 3rd | 60 / 40 / 25 × tier | A tier-S win is worth ~6 tournaments. |
| Circuit final podium (finished seasons): 1st / 2nd / 3rd | 40 / 25 / 15 × tier | A whole circuit season. |
| Circuit stage podium: 1st / 2nd / 3rd | 15 / 10 / 5 | 514 stage podiums, mostly per age category: frequent, so worth little each. Not counted when the same result is a tournament podium. |
| Rating threshold reached (per format) | 30 | Rewards improvement, not only results; the steps match the title ladder. |
| Highest title held, by `titles.tier` 1 / 2 / 3 / 4 | 50 / 100 / 200 / 300 | A Mestre Mirim and a Grande Mestre are not worth the same. Only the highest counts (until 2026-10-04 every title did, and two top titles gave 600). |

Tier multiplier for podiums: S × 1, A × 0.7, B × 0.5, School × 0.4. A category podium (Sub 18,
Sub 16, …) counts at half the overall podium of the same event. Badges give no XP: they come from
the same rows and would double-count.

Cumulative XP to reach level *n* is `25 × n × (n − 1)`:

| Level | 2 | 3 | 5 | 8 | 10 | 15 | 20 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| XP | 50 | 150 | 500 | 1400 | 2250 | 5250 | 9500 |

A newcomer with 3 tournaments (30 XP) is level 1 and reaches level 2 after two more. A long-time
regular with 50 tournaments, 5 wins, 10 other podiums, a Mestre title, and 3 thresholds
(500 + 300 + ~325 + 200 + 90 ≈ 1400 XP) reaches level 8. The most active player today (78 results)
with a full trophy cabinet and a tier-4 title lands around 2,300–2,600 XP, level 10–11. With 4
results per player on average, most players sit at levels 1–2. Levels above ~11 are reachable only
by future careers, which leaves room to grow.

Tasks:

- [x] `gamification/level.ts`: pure XP and level function over the stats input, with a breakdown per
  source; unit tests for every row of the table, the tier multipliers, the category factor, the
  stage/tournament double-count rule, and the level curve.
- [x] Load the player's titles (with tier) in `players.stats` (deferred from Phase 0) and return
  `level` from it.
- [x] Profile header: level and progress bar to the next level; a popover shows the breakdown and
  how XP is earned.
- [x] Distribution check script: computes every player's level from a database backup and prints
  the distribution, so the weights can be tuned (adjust the weights table, not the structure).
- [x] Run it on a production backup and record the distribution here before release.

**Production distribution (backup of 2026-10-04, current weights):**

| | Players | XP p50 | p90 | p99 | max | Level 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All | 5,384 | 0 | 60 | 450 | 2,250 | 4,711 | 432 | 128 | 67 | 23 | 15 | 4 | 1 | 2 | 1 |
| Active | 2,368 | 10 | 120 | 720 | 2,250 | 1,886 | 283 | 98 | 58 | 20 | 15 | 4 | 1 | 2 | 1 |

The top lands at level 10, as estimated. Titles weigh heavily at the top: the seven highest hold
600 XP of titles each (two tier-4 titles), and a player with 6 tournaments reaches level 7 on titles
and pre-record ratings, while the most active player (76 tournaments) is also level 7. 80% of
active players are level 1 (fewer than 5 tournaments).

**Rebalanced (same backup):** 15 XP per tournament and only the highest title counting.

| | Players | XP p50 | p90 | p99 | max | Level 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All | 5,384 | 0 | 75 | 550 | 2,080 | 4,600 | 481 | 159 | 74 | 37 | 19 | 10 | 2 | 2 |
| Active | 2,368 | 15 | 165 | 840 | 2,080 | 1,775 | 332 | 129 | 65 | 34 | 19 | 10 | 2 | 2 |

Half of the top 10 are now high-volume regulars (the two most active players moved to levels 8
and 7), titles add at most 300 XP, and level 2 takes 4 tournaments.
- [x] Docs: procedures, player guide.

---

## Phase 3 — Ranking position and movement

**Status: done (2026-10-03).** `gamification/ranking.ts`, `players.ranking`, movement in
`players.withFilters`, migration `0032`. Snapshot timestamps now carry milliseconds so two
snapshots in the same second stay distinct (ADR 0007 update).

**Players:** active only.

- "#3 no rating rápido" = `count(active players with rating > mine) + 1` per format, using the
  existing rating indexes; inactive players get no position.
- Movement ▲2 / ▼1 from the two latest `rankingSnapshots` (collected since Phase 0); hidden until a
  player has two snapshots.
- Profile and `/ratings` (position and movement columns).

Tasks:

- [x] `players.ranking`: live position and the number of ranked players per format, and movement
  between the two latest snapshots of that format (the change caused by the last import). Positions
  are live; movement is per import. Inactive players get neither.
- [x] Index `ranking_snapshots (rating_type, snapshot_at)` so finding the two latest snapshots of a
  format does not scan every snapshot ever taken.
- [x] `players.withFilters` returns each player's movement in the sorted format; `/ratings` shows it
  next to the position.
- [x] Profile: "#3 · ▲2" in each rating box.
- [x] Female player profiles also show their active Feminino rank beside their
  Absoluto rank; the Absoluto ranking continues to include all active players.
- [x] Rating update page: a button to take a snapshot now, so a baseline exists before the first
  import after release (movement needs two snapshots).
- [x] Tests (position with ties, inactive player, movement up/down/new/none) and docs.

---

## Phase 4 — Records and Hall of Fame

**Status: done (2026-10-03).** `gamification/records.ts`,
`loadAllPlayerStats`, `records.all`, `/estatisticas`. Measured on production-sized data: 16.8k rows read
per cache miss (`operations/query-cost-baseline`).

Route `/estatisticas`. **Players:** all.

- Highest peak per format, most wins, most podiums, most titles per championship, longest streak,
  biggest single gain, most active of the current year, highest levels. (No age-based records:
  64% of players have no birth date.)
- `records.all` public procedure computing on read with the stats module (Principle 2) over all
  8.5k history rows, behind the edge cache; cache policy entry; `ADMIN_QUERY_DEPENDENTS` as for
  `players.stats`. Confirm the D1 rows-read cost with `query-plans.sql` before release.
- The statistics overview summarizes registered and active players, active female players,
  tournaments and date coverage, rating results, podiums, completed circuits, clubs, and represented
  cities.
- [x] Statistics charts compare current active-player rating thresholds across time controls with
  grouped columns and show tournament shares by competition tier in a 100% stacked bar using shared chart tokens.
- `/recordes` permanently redirects to `/estatisticas`; the new URL is canonical and in the sitemap.
- Sitemap (`apps/web/src/lib/sitemap.ts`), `apps/web/scripts/check-ssr.ts`, `apps/web/e2e/a11y.e2e.ts`;
  link from the main nav.

Tasks:

- [x] Bulk loader: every player's career in one D1 batch (all results, podiums, circuit results,
  final podiums, titles), grouped in memory and fed to the same `playerStats`/`playerLevel` as the
  profile, so a record can never disagree with a profile.
- [x] `records.all`: top 10 per record and championship, equal values sharing a place; inactive holders flagged.
  Peaks per format, most tournament wins and podiums (overall), most titles per championship,
  longest streak, biggest single gain, most active this year (America/Sao_Paulo year), highest
  levels.
- [x] Route `/estatisticas` (Portuguese), legacy `/recordes` redirect, main nav link, sitemap, SSR
  check, a11y e2e.
- [x] Tests (ties, inactive holders, a record matches the holder's profile stats, empty database)
  and docs.
- [x] Free plan (10 ms of CPU per request): computing every career takes about 50 ms of compute
  plus row parsing, so it cannot run on each cache miss. Store the computed records and club
  standings in D1 (`computed_results`); any admin mutation marks the data as changed (one
  middleware, no per-mutation hooks), and a stored result is reused only when it was computed after
  the last change (and is less than a day old). The expensive request then happens once per admin
  change, globally, instead of per region every 5 minutes. Ranking with one shared `Intl.Collator`
  cut building the records from about 245 ms to 25 ms.
- [x] `records.statistics`: database-wide counts for players, female players, tournaments, rating
  results, tournament podiums, completed circuits, clubs, and cities with active players. The page
  keeps the all-time record lists below the overview; tests cover aggregate changes.

---

## Phase 5 — Clubs

**Status: done (2026-10-03).** `gamification/clubs.ts`, `clubs.leaderboard`, `clubs.byId`,
`/clubes`, `/clubes/$id`, club rank on the profile. 14k rows read per cache miss.

**Players:** active for strength; all for the all-time medal table.

- `clubs.leaderboard`: active member count, average of the top 5 active members per format,
  all-time medals of members.
- Routes `/clubes` and `/clubes/$id` (`route.tsx` + `index.tsx` + `$id.tsx`); sitemap, SSR check,
  a11y e2e.
- Club rank next to the club name on the profile.

Tasks:

- [x] `clubs.leaderboard`: per club, active members, strength per format (average of the top 5
  active members' ratings; only clubs with at least 5 active members are ranked, so one strong
  player cannot carry a club), rank per format, and the medal table of its current members' careers
  (tournament podiums, overall and category, and finished-circuit podiums; stage results are left
  out because they are too frequent). Membership is the player's current club: the data has no club
  history.
- [x] `clubs.byId` for the club page: club, members (active first, by rating), the leaderboard entry.
- [x] Routes `/clubes` (ranking with a format selector) and `/clubes/$id` (`route.tsx` + `index.tsx`
  + `$id.tsx`), main nav link, sitemap (club pages), SSR check, a11y e2e.
- [x] Profile: the club's strength rank next to the club name.
- [x] Tests (strength with fewer than 5 members, ties, inactive members excluded from strength but
  counted in medals, unknown club `NOT_FOUND`) and docs.

---

## Phase 6 — Activity heatmap and season recap

**Status: done (2026-10-03)**, except the deferred OG image. `gamification/season.ts`,
`players.season`, `/jogadores/$id/temporada/$ano`, `components/gamification/activity-heatmap.tsx`.

- **Heatmap:** results per month on the profile, dated results only; format with an explicit
  `timeZone`.
- **"Seu 2026":** `routes/_public/jogadores/$id/temporada.$ano.tsx` → `/jogadores/$id/temporada/$ano`.
  `$ano` validated by its own `params.parse` (4 digits, not in the future, else `notFound()`).
  `players.season({ id, year })` filters the stats module's output to that year: results, rating
  delta per format, podiums, achievements earned, best performance, XP gained.
- Shareable OG image for the recap URL via `buildSeo`. Not in the sitemap; one recap path in
  `check-ssr.ts` and `a11y.e2e.ts`. Linked from the profile for years with ≥1 dated result.

Tasks:

- [x] Heatmap on the profile: tournaments per month for each year played (dated results only; the
  dates are plain `YYYY-MM-DD`, read without `Date` to avoid time-zone shifts).
- [x] `gamification/season.ts` + `players.season({ id, year })`: tournaments, rating change per
  format, podiums, achievements earned, best performance, and XP gained that year, where XP gained
  = level XP of the career up to the end of the year minus up to the end of the previous year
  (ratings at each point are the chain's rating then, so a rating step counts in the year it was
  reached). `NOT_FOUND` for an unknown player or a year without dated activity.
- [x] Route `/jogadores/$id/temporada/$ano`, linked from the profile's years; one recap path in the
  SSR check and a11y e2e; not in the sitemap.
- [ ] Deferred: the OG image. Rendering images at the edge (Satori/resvg) costs hundreds of
  milliseconds of CPU, far above the free plan's 10 ms; revisit on the paid plan. The recap uses
  the player's photo as its preview meanwhile, and Phase 8.5 adds a card drawn in the browser.
- [x] Tests and docs.

---

## Phase 7 — "Novidades" feed

**Status: done (2026-10-03).** `gamification/feed.ts`, `records.recent`, the home "Novidades"
block. Off until `GAMIFICATION_LAUNCH_DATE` is set at release.

**Players:** all.

- `gamification.recent`: newest achievements (thresholds, peaks, titles, podiums, dynasties) whose
  source row was recorded after `GAMIFICATION_LAUNCH_DATE`, bounded `limit` (e.g. 20).
- Home page block: "🎉 Fulano ultrapassou 2000 no rápido", linking to the profile.
- Cache policy entry; invalidated by rating update, podium, and title mutations.

Tasks:

- [x] `records.recent`: achievements of recently active players (results, podiums, finished
  circuit podiums, titles, linked announcements recorded in the last 60 days and after
  `GAMIFICATION_LAUNCH_DATE`), newest first, at most 20, stored like the records. Only those
  players' careers are computed, so it stays cheap.
- [x] Home page "Novidades" block, hidden while the feed is empty; `GAMIFICATION_LAUNCH_DATE` stays
  `null` (feed off) until release.
- [x] Tests and docs.

---

## Phase 8 — Progress, rarity, and new emblems

**Status: done (2026-10-05).** Make achievements discoverable and motivating: show how close the
next goal is, how rare each emblem is, add emblems derived from data already recorded, and give
players something to share. Badges still give no XP (Phase 2), so levels don't change.

### 8.1 Progress on locked emblems
- [x] `upcomingOf` returns `progress: { current, target }` for each locked emblem (tournaments,
  rating thresholds, and the new ladders below).
- [x] The locked emblem popover shows the progress as a bar and "7 de 10 torneios" /
  "1958 de 2000 no rápido".
- [x] Tests: progress values per ladder, no progress for completed ladders.

### 8.2 "Próximo marco" (removed)
- [x] Removed the profile's single closest-goal callout; individual locked emblems continue to show
  their own progress bars and requirements.

### 8.3 Emblem rarity
- [x] One stored computation per data change (`computed_results`, key `gamification:<year>`)
  holds the records **and** the number of players holding each emblem, so an admin change
  triggers one expensive recompute, not two. `records.all` reads the records from it.
- [x] `records.badges` public procedure: share of players (with at least one tournament) holding
  each emblem, plus record holders (8.6). Cache policy entry; invalidated like `records.all`.
- [x] The emblem popover shows "12% dos jogadores têm". The profile loads it without suspending,
  so a recompute never delays or breaks the profile.
- [x] Tests: shares over a fixture, an emblem nobody holds.

### 8.4 New emblems (badges.ts, derived from existing data)
| Emblem | Rule | Tiers |
| --- | --- | --- |
| Veterano | Seasons with at least one result | 5 / 10 / 20 |
| Maratonista | Tournaments in a single year | 6 / 10 / 15 |
| Tríplice | All three formats played in the same year | single |
| Tríplice 2000 | Peak ≥ 2000 in rapid, blitz, and classic | single (platinum) |
| Volta por cima | A positive result right after 3+ results without gain, same format | single |
| Grande salto | Single-tournament gain of +30 / +50 / +80 | 3 |
| Circuito completo | Played every stage of a circuit season | single |
| Pódio de etapa | Circuit stage podiums | 3 / 10 / 25 |
| Campeão de categoria | First place in a tournament category (Sub-14, Feminino, …) | one per category |
| Década | A result 10+ years after the first recorded tournament | single |
| Recordista | Holds first place in a `/estatisticas` record list | single (from 8.3) |

- [x] Stats module: the derived fields these need (gain steps, comeback, formats per year, stage
  podium dates, category wins, stage counts per circuit season), each with provenance.
- [x] Loader: stage count per circuit season for "Circuito completo".
- [x] Unit tests per emblem, including legacy/undated provenance and ties.

### 8.5 Shareable season card
- [x] "Baixar imagem" on `/jogadores/$id/temporada/$ano`: draws the season summary (name, year,
  tournaments, best result, XP, podiums, rating change) to a canvas in the browser and downloads
  a PNG. Replaces the deferred server-rendered OG image without any edge CPU.

### 8.6 Path to title (unofficial)
- [x] `titlePath(...)`: show only the next major-title goal (CMS → MSE → GMS), while retaining
  eligible youth and female-title goals. Requirements from `/normas-tecnicas` are checks with
  progress: peak rating, top-3 overall finishes and wins in the listed Sergipanos (Absoluto, Rápido,
  Blitz, Equipes), sex for MFS, and age for MMS/MJS when a birth date exists. MSHC (honorary) is
  excluded.
- [x] Profile section "Caminho para títulos", marked unofficial: the federation grants titles,
  top-5 finishes aren't recorded (only podiums), and championships approved case by case aren't
  counted.
- [x] Tests: major-title progression, each title's rule, a player over the youth age limit, unknown
  birth date.

### 8.7 "Destaque do mês" on the home page
- [x] `records.monthHighlight`: the biggest single-tournament rating gain in the current month
  (America/Sao_Paulo); `null` when the month has no results. Cache policy and invalidation entries.
- [x] Home block linking to the player and the tournament; hidden when `null`.
- [x] Integration tests: picks the largest gain, ignores other months.

### 8.8 Docs and verification
- [x] Update `reference/procedures.mdx`, `guide/players.mdx`, and DESIGN.md where the UI changes.
- [x] `bun test`, `bun run check-types`, `bun run lint`, browser check of profile, season, and home.

---

## Order and sizing

| # | Phase | Schema change | Size |
| --- | --- | --- | --- |
| 0 | Foundations (+ audit, snapshots) ✅ | `rankingSnapshots` | L |
| 1 | Profile achievements + circuits + title emblems ✅ | `titles.tier` (competition tiers and circuit seasons are done) | M |
| 2 | Player level ✅ | — | S |
| 3 | Ranking position and movement ✅ | — | S |
| 4 | Records / Hall of Fame ✅ | — | M |
| 5 | Clubs ✅ | — | M |
| 6 | Heatmap + season recap ✅ | — | M |
| 7 | Home feed ✅ | — | S |
| 8 | Progress, rarity, new emblems, path to title, highlight ✅ | — | L |

## Deferred

- **Insignias** (`insignias`, `playersToInsignias`): reworked before being shown; then they plug
  into `AchievementBadge` and the XP table.
- **Placements from the rating import:** podiums can now be entered for any tournament by hand.
  The rating update imports a Swiss Manager spreadsheet (`tournamentid`, `variation`,
  `ratingtype`, …); an optional rank column stored as a nullable `playersToTournaments.place` would
  fill them automatically and add "top 10 finishes". Not retroactive.
- **Defending champions:** `defending_champions` is maintained by hand. It could be derived as the
  overall winner of each championship's latest tournament.
- **Cups:** head-to-head, rivals, cup records, `/confronto`, cup XP. First confirm whether
  `cupMatches.winnerId = null` means a draw or an unplayed match.

## Docs to update

- `reference/procedures.mdx` — every new procedure.
- `reference/routes.mdx` — `/estatisticas`, `/clubes`, season recap.
- `reference/database.mdx` — `rankingSnapshots`, `titles.tier`. (Competition tiers, podium
  categories, and circuit seasons are already documented.)
- `guide/players.mdx` — new profile sections.
- `operations/runbook.mdx` — the gamification readiness audit, next to the other audits.
- ADRs listed in Phase 0.
