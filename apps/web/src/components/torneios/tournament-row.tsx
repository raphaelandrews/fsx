import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Trophy } from "@hugeicons/core-free-icons";
import type { inferRouterOutputs } from "@trpc/server";

import type { CompetitionTier } from "@fsx/api/circuit-types";
import type { RatingType } from "@fsx/api/rating-types";
import type { AppRouter } from "@fsx/api/routers/index";

import { formatIsoDate } from "@/components/gamification/tier";

import { RHYTHM_LABELS, TIER_LABELS } from "./labels";

export type TournamentListItem = inferRouterOutputs<AppRouter>["tournaments"]["page"]["tournaments"][number];

function winnersText(winners: TournamentListItem["winners"]) {
  if (winners.length === 0) return null;
  const shown = winners.slice(0, 2).map((winner) => winner.name);
  return winners.length > 2 ? `${shown.join(", ")} e mais ${winners.length - 2}` : shown.join(" e ");
}

export function TournamentRow({ tournament }: { tournament: TournamentListItem }) {
  const winners = winnersText(tournament.winners);
  const details = [
    tournament.date ? formatIsoDate(tournament.date) : null,
    RHYTHM_LABELS[tournament.ratingType as RatingType] ?? tournament.ratingType,
    TIER_LABELS[tournament.tier as CompetitionTier] ?? tournament.tier,
    tournament.championship?.name ?? null,
  ].filter(Boolean);

  return (
    <li className="m-1">
      <Link
        to="/torneios/$id"
        params={{ id: tournament.id }}
        className="group flex items-start gap-3 rounded-md p-3 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground" aria-hidden>
          <HugeiconsIcon icon={Trophy} className="size-4" strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-pretty font-semibold text-base leading-snug">{tournament.name}</span>
          <span className="text-muted-foreground text-sm tabular-nums">{details.join(" · ")}</span>
          {winners ? <span className="text-sm">Campeão: {winners}</span> : null}
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-4 shrink-0 self-center text-muted-foreground transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </Link>
    </li>
  );
}
