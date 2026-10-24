import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";

import type { CompetitionTier } from "@fsx/api/circuit-types";
import type { RatingType } from "@fsx/api/rating-types";
import type { AppRouter } from "@fsx/api/routers/index";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fsx/ui/components/table";

import { formatIsoDate } from "@/components/gamification/tier";

import { RHYTHM_LABELS, TIER_LABELS } from "./labels";

export type TournamentListItem = inferRouterOutputs<AppRouter>["tournaments"]["page"]["tournaments"][number];

function winnersText(winners: TournamentListItem["winners"]) {
  if (winners.length === 0) return null;
  const shown = winners.slice(0, 2).map((winner) => winner.name);
  return winners.length > 2 ? `${shown.join(", ")} e mais ${winners.length - 2}` : shown.join(" e ");
}

export function TournamentTable({ tournaments }: { tournaments: TournamentListItem[] }) {
  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-28 md:table-cell">Data</TableHead>
            <TableHead>Torneio</TableHead>
            <TableHead className="hidden md:table-cell">Ritmo</TableHead>
            <TableHead className="hidden md:table-cell">Tier</TableHead>
            <TableHead className="hidden md:table-cell">Campeão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament) => {
            const winners = winnersText(tournament.winners);
            const date = tournament.date ? formatIsoDate(tournament.date) : "—";
            const rhythm = RHYTHM_LABELS[tournament.ratingType as RatingType] ?? tournament.ratingType;
            const tier = TIER_LABELS[tournament.tier as CompetitionTier] ?? tournament.tier;
            return (
              <TableRow key={tournament.id} className="relative">
                <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">{date}</TableCell>
                <TableCell className="whitespace-normal">
                  <Link
                    to="/torneios/$id"
                    params={{ id: tournament.id }}
                    className="text-pretty font-semibold after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {tournament.name}
                  </Link>
                  {tournament.championship && (
                    <span className="block text-muted-foreground text-sm">{tournament.championship.name}</span>
                  )}
                  <span className="mt-0.5 block text-muted-foreground text-sm tabular-nums md:hidden">
                    {date} · {rhythm} · {tier}
                  </span>
                  {winners && <span className="mt-0.5 block text-sm md:hidden">Campeão: {winners}</span>}
                </TableCell>
                <TableCell className="hidden md:table-cell">{rhythm}</TableCell>
                <TableCell className="hidden md:table-cell">{tier}</TableCell>
                <TableCell className="hidden whitespace-normal md:table-cell">{winners ?? "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
