// Which tournaments would the tier suggestion change? Reads a local D1 SQLite file (read-only) and
// prints a Markdown review list; nothing is written. Uses the lines saved by the dashboard's Recalibrate button. Tier S is skipped: it follows the championship.
//   bun packages/api/scripts/tier-review.ts .alchemy/miniflare/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite
import { Database } from "bun:sqlite";

import type { CompetitionTier } from "../src/circuit-types";
import { suggestTier, type StrengthLines } from "../src/gamification/tier-suggestion";
import type { RatingType } from "../src/rating-types";

const path = process.argv[2];
if (!path) {
  console.error("Usage: bun packages/api/scripts/tier-review.ts <local-d1.sqlite>");
  process.exit(2);
}

const db = new Database(path, { readonly: true });
const tournaments = db
  .query<{ id: number; name: string; date: string | null; tier: CompetitionTier; ratingType: RatingType }, []>(
    "SELECT id, name, date, tier, rating_type AS ratingType FROM tournaments WHERE tier != 'S' ORDER BY date DESC, id DESC",
  )
  .all();
const ratingsOf = db.query<{ oldRating: number }, [number]>("SELECT old_rating AS oldRating FROM players_to_tournaments WHERE tournament_id = ?");

const stored = db.query<{ value: string }, []>("SELECT value FROM computed_results WHERE key = 'tier-calibration'").get();
const lines = stored ? (JSON.parse(stored.value) as StrengthLines) : undefined;

const changes = new Map<string, string[]>();
let unchanged = 0;
let unmeasured = 0;
for (const tournament of tournaments) {
  const result = suggestTier({
    tier: tournament.tier,
    ratingType: tournament.ratingType,
    ratings: ratingsOf.all(tournament.id).map((row) => row.oldRating),
    lines,
  });
  if (result.suggested === null) unmeasured++;
  else if (result.suggested === tournament.tier) unchanged++;
  else {
    const key = `${tournament.tier} → ${result.suggested}`;
    changes.set(key, [
      ...(changes.get(key) ?? []),
      `- #${tournament.id} ${tournament.name} (${tournament.date ?? "no date"}, ${tournament.ratingType}): ${result.players} players, top-10 average ${result.strength}`,
    ]);
  }
}

console.log(`# Tier review\n\n${tournaments.length} non-Sergipano tournaments: ${unchanged} already match, ${unmeasured} have no results.\n`);
for (const [key, lines] of [...changes].sort()) console.log(`## ${key} (${lines.length})\n\n${lines.join("\n")}\n`);
