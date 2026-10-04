import { Link } from "@tanstack/react-router";

import { Medal } from "@/components/gamification/medal";
import { slugify } from "@/utils/slugify";

import type { PlayerCircuitSeason } from "./types";

const categoryLabel = (category: string | null) => category ?? "Geral";

export function PlayerCircuits({ seasons }: { seasons: PlayerCircuitSeason[] }) {
  if (seasons.length === 0) return null;
  return (
    <ul className="divide-y px-2 sm:px-4">
      {seasons.map((season) => (
        <li key={season.circuit.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/circuitos"
              search={{ ano: season.circuit.year ?? undefined, circuito: slugify(season.circuit.name) }}
              className="font-medium text-sm hover:underline"
            >
              {season.circuit.name}
            </Link>
            <p className="text-muted-foreground text-xs">
              {season.circuit.finishedAt ? "Encerrado" : "Em andamento"}
              {season.stagesPlayed > 0 &&
                ` · ${season.stagesPlayed} etapa${season.stagesPlayed === 1 ? "" : "s"} · ${season.points} pts`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {season.finalPodiums.map((podium) =>
              podium.place <= 3 ? (
                <span key={`${podium.category}-${podium.place}`} className="inline-flex items-center gap-1 text-xs">
                  <Medal place={podium.place as 1 | 2 | 3} />
                  <span>{categoryLabel(podium.category)}</span>
                </span>
              ) : null,
            )}
            {season.standings.map((standing) => (
              <span key={standing.category ?? ""} className="rounded-md bg-muted px-2 py-1 text-xs">
                {standing.position}º de {standing.players}
                {standing.category ? ` · ${standing.category}` : ""}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
