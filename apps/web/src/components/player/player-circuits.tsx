import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@fsx/ui/lib/utils";

import { Medal } from "@/components/gamification/medal";
import { slugify } from "@/utils/slugify";

import type { PlayerCircuitSeason } from "./types";

const categoryLabel = (category: string | null) => category ?? "Geral";

export function PlayerCircuits({ seasons }: { seasons: PlayerCircuitSeason[] }) {
  if (seasons.length === 0) return null;
  return (
    <ul className="flex flex-col pb-2">
      {seasons.map((season) => {
        const finished = Boolean(season.circuit.finishedAt);
        return (
          <li key={season.circuit.id} className="m-1">
            <div className="flex flex-col gap-2 rounded-md p-3 transition-colors duration-200 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link
                  to="/circuitos"
                  search={{ ano: season.circuit.year ?? undefined, circuito: slugify(season.circuit.name) }}
                  className="group inline-flex items-center gap-1 font-medium text-sm hover:underline"
                >
                  {season.circuit.name}
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                </Link>
                <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", finished ? "bg-muted-foreground/50" : "bg-success")}
                    aria-hidden
                  />
                  <span className="tabular-nums">
                    {finished ? "Encerrado" : "Em andamento"}
                    {season.stagesPlayed > 0 &&
                      ` · ${season.stagesPlayed} etapa${season.stagesPlayed === 1 ? "" : "s"} · ${season.points} pts`}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {season.finalPodiums.map((podium) =>
                  podium.place <= 3 ? (
                    <span
                      key={`${podium.category}-${podium.place}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-muted py-0.5 pr-2 pl-0.5 font-medium text-xs"
                    >
                      <Medal place={podium.place as 1 | 2 | 3} className="px-1.5 py-0.5" />
                      {categoryLabel(podium.category)}
                    </span>
                  ) : null,
                )}
                {season.standings.map((standing) => (
                  <span key={standing.category ?? ""} className="rounded-md bg-muted px-2 py-1 text-xs tabular-nums">
                    <span className="font-medium">{standing.position}º</span>
                    <span className="text-muted-foreground"> de {standing.players}</span>
                    {standing.category ? ` · ${standing.category}` : ""}
                  </span>
                ))}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
