import { Link } from "@tanstack/react-router";
import { StarIcon } from "@hugeicons/core-free-icons";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";

import { Section } from "./section";

type Highlight = NonNullable<inferRouterOutputs<AppRouter>["records"]["monthHighlight"]>;

const FORMATS: Record<string, string> = { classic: "no clássico", rapid: "no rápido", blitz: "na blitz" };

// "2026-10" read as UTC so server and client name the same month.
const monthName = (month: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

export function MonthHighlight({ highlight }: { highlight: Highlight }) {
  const name = highlight.player.nickname || highlight.player.name;
  return (
    <Section icon={StarIcon} label="Destaque do mês" main={false}>
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-2xl bg-muted px-6 py-8 text-center">
        <p className="text-muted-foreground text-sm capitalize">{monthName(highlight.month)}</p>
        <Link
          to="/jogadores/$id"
          params={{ id: highlight.player.id }}
          className="text-balance font-semibold text-2xl tracking-tight underline-offset-4 hover:underline"
        >
          {name}
        </Link>
        <p className="font-semibold text-4xl text-success tabular-nums">
          +{highlight.variation}
          <span className="ml-2 font-medium text-base text-muted-foreground">{FORMATS[highlight.ratingType] ?? ""}</span>
        </p>
        <p className="text-pretty text-reading text-sm">Maior ganho de rating do mês, no {highlight.tournament.name}.</p>
      </div>
    </Section>
  );
}
