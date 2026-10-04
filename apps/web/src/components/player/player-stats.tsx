import { Link } from "@tanstack/react-router";

import { ActivityHeatmap, heatmapRows } from "@/components/gamification/activity-heatmap";
import { StatTile } from "@/components/gamification/stat-tile";

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
  const rows = heatmapRows(stats.played.map((played) => played.date)).map((row) => ({
    ...row,
    label: (
      <Link
        to="/jogadores/$id/temporada/$ano"
        params={{ id: playerId, ano: row.year }}
        className="hover:underline"
        aria-label={`Temporada ${row.year}`}
      >
        {row.year}
      </Link>
    ),
  }));

  return (
    <div className="space-y-4 px-2 sm:px-4">
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
          hint={bestGain?.tournamentId ? tournaments[bestGain.tournamentId]?.name : undefined}
        />
        <StatTile
          label="Maior sequência"
          value={bestStreak}
          hint={currentStreak > 0 ? `atual: ${currentStreak} subindo` : "torneios seguidos subindo"}
        />
      </div>
      {rows.length > 0 && (
        <div>
          <h3 className="mb-2 text-muted-foreground text-xs font-medium">Torneios por mês · abra um ano para ver a temporada</h3>
          <ActivityHeatmap rows={rows} />
        </div>
      )}
    </div>
  );
}
