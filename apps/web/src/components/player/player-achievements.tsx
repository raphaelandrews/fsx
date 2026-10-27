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

export function Subheading({ id, children, aside, as: Heading = "h3" }: { id?: string; children: ReactNode; aside?: ReactNode; as?: "h2" | "h3" }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <Heading id={id} className="font-medium text-muted-foreground text-sm">
        {children}
      </Heading>
      {aside && <span className="text-muted-foreground text-sm tabular-nums">{aside}</span>}
    </div>
  );
}

export function TrophyCabinet({ medals }: { medals: PlayerStatsResult["stats"]["medals"] }) {
  const total = (place: "gold" | "silver" | "bronze") => MEDAL_GROUPS.reduce((sum, [key]) => sum + medals[key][place], 0);
  const totals = ([1, 2, 3] as const).map((place) => ({ place, count: total(place === 1 ? "gold" : place === 2 ? "silver" : "bronze") }));
  const groups = MEDAL_GROUPS.map(([key, label]) => ({ label, count: medals[key].gold + medals[key].silver + medals[key].bronze })).filter(
    (group) => group.count > 0,
  );
  const all = totals.reduce((sum, { count }) => sum + count, 0);
  if (all === 0) return null;
  return (
    <section aria-labelledby="player-medals">
      <Subheading id="player-medals" aside={`${all} medalha${all === 1 ? "" : "s"}`}>
        Quadro de medalhas
      </Subheading>
      <div className="flex flex-col gap-2 rounded-2xl bg-muted px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          {totals.map(({ place, count }) => (count > 0 ? <Medal key={place} place={place} count={count} /> : null))}
        </div>
        <p className="text-muted-foreground text-sm tabular-nums">
          {groups.map((group) => `${group.label} ${group.count}`).join(" · ")}
        </p>
      </div>
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
