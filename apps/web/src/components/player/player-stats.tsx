import { Link } from "@tanstack/react-router";

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
      {stats.seasons.length > 0 && (
        <section aria-labelledby="player-activity">
          <Subheading id="player-activity" aside="Abra um ano para ver a temporada">
            Torneios por mês
          </Subheading>
          <ActivityGraph
            dates={stats.played.map((played) => played.date)}
            yearLabel={(year) => (
              <Link
                to="/jogadores/$id/temporada/$ano"
                params={{ id: playerId, ano: year }}
                className="rounded-sm text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
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
