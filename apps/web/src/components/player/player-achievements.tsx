import type { ReactNode } from "react";

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

export function Subheading({ id, children, aside }: { id?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h3 id={id} className="font-medium text-muted-foreground text-xs">
        {children}
      </h3>
      {aside && <span className="text-muted-foreground text-xs tabular-nums">{aside}</span>}
    </div>
  );
}

export function TrophyCabinet({ medals }: { medals: PlayerStatsResult["stats"]["medals"] }) {
  const groups = MEDAL_GROUPS.filter(([key]) => medals[key].gold + medals[key].silver + medals[key].bronze > 0);
  if (groups.length === 0) return null;
  return (
    <section aria-labelledby="player-medals">
      <Subheading id="player-medals">Quadro de medalhas</Subheading>
      <dl className="grid gap-2 sm:grid-cols-2">
        {groups.map(([key, label]) => (
          <div key={key} className="flex min-h-12 items-center justify-between gap-2 rounded-2xl bg-muted px-3 py-2">
            <dt className="font-medium text-foreground/70 text-xs sm:text-sm">{label}</dt>
            <dd className="flex gap-1.5">
              {([1, 2, 3] as const).map((place) => {
                const count = medals[key][place === 1 ? "gold" : place === 2 ? "silver" : "bronze"];
                return count > 0 ? <Medal key={place} place={place} count={count} /> : null;
              })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AchievementGrid({ achievements, upcoming }: Pick<PlayerStatsResult, "achievements" | "upcoming">) {
  if (achievements.length === 0 && upcoming.length === 0) return null;
  return (
    <section aria-labelledby="player-badges">
      <Subheading
        id="player-badges"
        aside={achievements.length > 0 ? `${achievements.length} conquistada${achievements.length === 1 ? "" : "s"}` : undefined}
      >
        Emblemas
      </Subheading>
      <ul className="flex flex-wrap gap-2" aria-label="Emblemas conquistados e próximos">
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
    </section>
  );
}
