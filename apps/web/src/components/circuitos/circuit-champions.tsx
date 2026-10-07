import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Medal01Icon, MedalFirstPlaceIcon, MedalSecondPlaceIcon, MedalThirdPlaceIcon } from "@hugeicons/core-free-icons";

import type { Circuit } from "./types";

const PLACE_ICONS = { 1: MedalFirstPlaceIcon, 2: MedalSecondPlaceIcon, 3: MedalThirdPlaceIcon } as const;

// finishedAt is a plain YYYY-MM-DD; formatting it through Date would shift it a
// day in UTC-3 and differ between server and client.
const formatDate = (iso: string) => iso.split("-").reverse().join("/");

export function CircuitStatus({ circuit }: { circuit: Circuit }) {
  return (
    <p className="mb-4 text-center text-muted-foreground text-base">
      {circuit.year ? `Temporada ${circuit.year} · ` : ""}
      {circuit.finishedAt ? `Encerrada em ${formatDate(circuit.finishedAt)}` : "Em andamento"}
    </p>
  );
}

export function CircuitChampions({ circuit }: { circuit: Circuit }) {
  if (!circuit.finishedAt || circuit.circuitFinalPodiums.length === 0) return null;

  const groups = new Map<string, Circuit["circuitFinalPodiums"]>();
  for (const podium of circuit.circuitFinalPodiums) {
    const key = podium.category ?? "Geral";
    groups.set(key, [...(groups.get(key) ?? []), podium]);
  }

  return (
    <section aria-labelledby="circuit-champions" className="mb-8">
      <h2 id="circuit-champions" className="mb-3 font-semibold text-lg">
        Pódio final
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...groups].map(([category, podiums]) => (
          <div key={category} className="rounded-lg border p-3">
            <h3 className="mb-2 font-medium text-base">{category}</h3>
            <ol className="space-y-1.5">
              {podiums.map((podium) => (
                <li key={podium.id} className="flex items-center gap-2 text-base">
                  <HugeiconsIcon
                    icon={PLACE_ICONS[podium.place as keyof typeof PLACE_ICONS] ?? Medal01Icon}
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="sr-only">{podium.place}º lugar:</span>
                  <Link
                    to="/jogadores/$id"
                    params={{ id: podium.playerId }}
                    className="truncate font-semibold hover:underline"
                  >
                    {podium.player.name}
                  </Link>
                  {podium.points != null && (
                    <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                      {podium.points} pts
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
