import type { Achievement, BadgeTier } from "@fsx/api/gamification/badges";

import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { Medal } from "@/components/gamification/medal";

import type { PlayerStatsResult } from "./types";

const TIER_RANK: Record<BadgeTier, number> = { platinum: 3, gold: 2, silver: 1, bronze: 0 };

// Highest tier first, then most recent; undated achievements last within a tier.
const byPrestige = (a: Achievement, b: Achievement) =>
  TIER_RANK[b.tier] - TIER_RANK[a.tier] || (b.earnedAt ?? "").localeCompare(a.earnedAt ?? "");

const MEDAL_GROUPS = [
  ["tournament", "Torneios"],
  ["tournamentCategory", "Categorias"],
  ["circuitFinal", "Circuitos"],
  ["circuitStage", "Etapas de circuito"],
] as const;

export function TrophyCabinet({ medals }: { medals: PlayerStatsResult["stats"]["medals"] }) {
  const groups = MEDAL_GROUPS.filter(([key]) => medals[key].gold + medals[key].silver + medals[key].bronze > 0);
  if (groups.length === 0) return null;
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {groups.map(([key, label]) => (
        <div key={key} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
          <dt className="text-foreground text-xs font-medium">{label}</dt>
          <dd className="flex gap-1.5">
            {([1, 2, 3] as const).map((place) => {
              const count = medals[key][place === 1 ? "gold" : place === 2 ? "silver" : "bronze"];
              return count > 0 ? <Medal key={place} place={place} count={count} /> : null;
            })}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AchievementGrid({ achievements, upcoming }: Pick<PlayerStatsResult, "achievements" | "upcoming">) {
  if (achievements.length === 0 && upcoming.length === 0) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-2 sm:justify-start" aria-label="Medalhas e conquistas">
      {[...achievements].sort(byPrestige).map((achievement) => (
        <li key={achievement.id}>
          <AchievementBadge achievement={achievement} />
        </li>
      ))}
      {upcoming.map((achievement) => (
        <li key={`next-${achievement.id}`}>
          <AchievementBadge achievement={achievement} locked />
        </li>
      ))}
    </ul>
  );
}
