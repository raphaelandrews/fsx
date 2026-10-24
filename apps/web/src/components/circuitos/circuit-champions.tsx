import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Medal01Icon, MedalFirstPlaceIcon, MedalSecondPlaceIcon, MedalThirdPlaceIcon, Route01Icon } from "@hugeicons/core-free-icons";

import { SectionHeading } from "@/components/section-heading";

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

/** The stages of the season, each a link to its tournament page; "E1" is the label the points table uses. */
export function CircuitStages({ circuit }: { circuit: Circuit }) {
  const stages = [...circuit.circuitPhases]
    .filter((phase) => phase.tournament)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (stages.length === 0) return null;

  return (
    <section aria-label="Etapas" className="mb-8">
      <SectionHeading icon={Route01Icon} label="Etapas" className="px-0" />
      <ol className="grid gap-1 sm:grid-cols-2">
        {stages.map((phase, index) => (
          <li key={phase.id}>
            <Link
              to="/torneios/$id"
              params={{ id: phase.tournament!.id }}
              className="group flex items-center gap-3 rounded-md p-3 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm tabular-nums" aria-hidden>
                E{index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="sr-only">{index + 1}ª etapa: </span>
                <span className="block text-pretty font-medium leading-snug">{phase.tournament!.name}</span>
                {phase.club && <span className="block text-muted-foreground text-sm">Sede: {phase.club.name}</span>}
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 shrink-0 text-muted-foreground transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
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
      <h2 id="circuit-champions" className="mb-3 font-bold text-base text-title">
        Pódio final
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...groups].map(([category, podiums]) => (
          <div key={category} className="rounded-2xl bg-muted p-3">
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
