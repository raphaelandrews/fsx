import type { ReactNode } from "react";

import { BadgesByTier, type RarityLookup } from "@/components/gamification/achievement-badge";
import { Medal } from "@/components/gamification/medal";

import type { PlayerStatsResult } from "./types";

const MEDAL_GROUPS = [
  ["tournament", "Torneios"],
  ["tournamentCategory", "Categorias"],
  ["circuitFinal", "Circuitos"],
  ["circuitStage", "Etapas de circuito"],
] as const;

export function Subheading({ id, children, aside }: { id?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h3 id={id} className="font-medium text-muted-foreground text-sm">
        {children}
      </h3>
      {aside && <span className="text-muted-foreground text-sm tabular-nums">{aside}</span>}
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
            <dt className="font-medium text-foreground/70 text-base">{label}</dt>
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

export function AchievementGrid({
  achievements,
  upcoming,
  rarity,
}: Pick<PlayerStatsResult, "achievements" | "upcoming"> & { rarity?: RarityLookup }) {
  if (achievements.length === 0 && upcoming.length === 0) return null;
  return (
    <section aria-labelledby="player-badges">
      <Subheading
        id="player-badges"
        aside={achievements.length > 0 ? `${achievements.length} conquistada${achievements.length === 1 ? "" : "s"}` : undefined}
      >
        Emblemas
      </Subheading>
      <BadgesByTier achievements={achievements} upcoming={upcoming} rarity={rarity} />
    </section>
  );
}
