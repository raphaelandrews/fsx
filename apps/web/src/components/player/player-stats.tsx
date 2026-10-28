import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";

import { ActivityGraph } from "@/components/gamification/activity-graph";
import { StatTile } from "@/components/gamification/stat-tile";

import { Subheading } from "./player-achievements";
import type { PlayerStatsResult } from "./types";

export function PlayerStats({
  playerId,
  stats,
  tournaments,
}: Pick<PlayerStatsResult, "stats" | "tournaments"> & { playerId: number }) {
  if (stats.tournamentsPlayed === 0) return null;

  const formats = Object.values(stats.formats).filter((format) => format !== null);
  const bestGain = formats
    .flatMap((format) => (format.bestGain ? [format.bestGain] : []))
    .sort((a, b) => b.variation - a.variation)[0];
  const bestStreak = Math.max(0, ...formats.map((format) => format.bestStreak));
  const currentStreak = Math.max(0, ...formats.map((format) => format.currentStreak));
  const firstYear = stats.seasons[0];
  const latestYear = stats.seasons[stats.seasons.length - 1];

  return (
    <div className="space-y-6 px-2 pb-4 sm:px-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label="Torneios"
          value={stats.tournamentsPlayed}
          hint={stats.seasons.length > 0 ? `em ${stats.seasons.length} temporada${stats.seasons.length === 1 ? "" : "s"}` : undefined}
        />
        <StatTile label="Jogando desde" value={firstYear ?? "—"} />
        <StatTile
          label="Melhor desempenho"
          value={bestGain ? `+${bestGain.variation}` : "—"}
          valueClassName={bestGain ? "text-success" : undefined}
          hint={bestGain?.tournamentId ? tournaments[bestGain.tournamentId]?.name : undefined}
        />
        <StatTile
          label="Maior sequência"
          value={bestStreak}
          hint={currentStreak > 0 ? `atual: ${currentStreak} subindo` : "torneios seguidos subindo"}
        />
      </div>
      {latestYear ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HugeiconsIcon icon={SparklesIcon} className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-semibold">Retrospectiva {latestYear}</p>
              <p className="text-muted-foreground text-sm">Seu ano em imagens, prontas para postar nos stories.</p>
            </div>
          </div>
          <Link
            to="/jogadores/$id/temporada/$ano"
            params={{ id: playerId, ano: latestYear }}
            search={{ retro: true }}
            className={buttonVariants({ size: "lg" })}
          >
            Gerar retrospectiva
          </Link>
        </div>
      ) : null}
      {stats.seasons.length > 0 && (
        <section aria-labelledby="player-activity">
          <Subheading id="player-activity" aside="Toque num ano para ver a temporada">
            Torneios por mês
          </Subheading>
          <ActivityGraph
            dates={stats.played.map((played) => played.date)}
            yearLabel={(year) => (
              <Link
                to="/jogadores/$id/temporada/$ano"
                params={{ id: playerId, ano: year }}
                className="-m-2 inline-block rounded-sm p-2 text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`Temporada ${year}`}
              >
                {year}
              </Link>
            )}
          />
        </section>
      )}
    </div>
  );
}
