import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";

import { Medal } from "@/components/gamification/medal";

type Podium = inferRouterOutputs<AppRouter>["tournaments"]["byId"]["tournamentPodiums"][number];

function Place({ place }: { place: number }) {
  return place >= 1 && place <= 3 ? (
    <Medal place={place as 1 | 2 | 3} />
  ) : (
    <span className="inline-flex min-w-9 justify-center font-medium text-muted-foreground tabular-nums">{place}º</span>
  );
}

/** The overall classification first, then one list per category. */
export function TournamentPodium({ podiums }: { podiums: Podium[] }) {
  if (podiums.length === 0) return null;

  const groups = new Map<string, Podium[]>();
  for (const podium of podiums) {
    const key = podium.category ?? "";
    groups.set(key, [...(groups.get(key) ?? []), podium]);
  }
  const ordered = [...groups].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b, "pt-BR")));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ordered.map(([category, rows]) => (
        <div key={category} className="rounded-2xl border p-4">
          <h3 className="mb-2 font-semibold">{category || "Classificação geral"}</h3>
          <ol className="space-y-1.5">
            {rows.map((podium) => (
              <li key={podium.id} className="flex items-center gap-2">
                <Place place={podium.place} />
                <Link to="/jogadores/$id" params={{ id: podium.player.id }} className="link-inline">
                  {podium.player.nickname || podium.player.name}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
