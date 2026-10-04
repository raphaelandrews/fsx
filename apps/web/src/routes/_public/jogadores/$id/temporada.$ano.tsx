import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Award01Icon,
  Calendar01Icon,
  ChartBarLineIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { Announcement } from "@/components/announcement";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { ActivityGraph } from "@/components/gamification/activity-graph";
import { Medal } from "@/components/gamification/medal";
import { StatTile } from "@/components/gamification/stat-tile";
import { orNotFound } from "@/lib/errors";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

// The federation's calendar year; a future season has nothing to show.
const currentYear = () =>
  Number(new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(new Date()));

const FORMATS = [
  ["classic", "Clássico"],
  ["rapid", "Rápido"],
  ["blitz", "Blitz"],
] as const;

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

export const Route = createFileRoute("/_public/jogadores/$id/temporada/$ano")({
  params: {
    parse: ({ ano }: { ano: string }): { ano: number } => {
      const year = Number(ano);
      if (!/^\d{4}$/.test(ano) || year < 1900 || year > currentYear()) throw notFound();
      return { ano: year };
    },
    stringify: ({ ano }: { ano: number }) => ({ ano: String(ano) }),
  },
  loader: ({ context, params }) =>
    orNotFound(context.queryClient.ensureQueryData(context.trpc.players.season.queryOptions({ id: params.id, year: params.ano }))),
  head: ({ loaderData }) => {
    if (!loaderData) return buildSeo({ title: withBrand("Temporada"), path: "/ratings", noindex: true });
    const name = loaderData.player.nickname || loaderData.player.name;
    const path = `/jogadores/${loaderData.player.id}/temporada/${loaderData.year}`;
    return buildSeo({
      title: withBrand(`Temporada ${loaderData.year} de ${name}`),
      description: `${name} em ${loaderData.year}: ${loaderData.tournamentsPlayed} torneios, variação de rating, pódios e conquistas no xadrez sergipano.`,
      path,
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name, path: `/jogadores/${loaderData.player.id}` },
        { name: `Temporada ${loaderData.year}`, path },
      ]),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { id, ano } = Route.useParams();
  const { data: season } = useSuspenseQuery(trpc.players.season.queryOptions({ id, year: ano }));
  const name = season.player.nickname || season.player.name;
  const index = season.seasons.indexOf(season.year);
  const previous = season.seasons[index - 1];
  const next = season.seasons[index + 1];

  return (
    <div className="mx-auto max-w-[720px] pb-12">
      <header className="pt-8 pb-6 text-center sm:pt-12 sm:pb-8">
        <Link
          to="/jogadores/$id"
          params={{ id }}
          className="inline-flex items-center gap-1 rounded-sm text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden />
          {name}
        </Link>
        <h1 className="mt-2 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
          Temporada <span className="tabular-nums">{season.year}</span>
        </h1>
        <nav aria-label="Outras temporadas" className="mt-4 flex justify-center gap-2">
          <SeasonLink id={id} year={previous} direction="previous" />
          <SeasonLink id={id} year={next} direction="next" />
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-4 sm:gap-4 sm:px-4">
        <StatTile label="Torneios" value={season.tournamentsPlayed} />
        <StatTile
          label="Melhor desempenho"
          value={season.bestGain ? `+${season.bestGain.variation}` : "—"}
          valueClassName={season.bestGain ? "text-emerald-700 dark:text-emerald-400" : undefined}
          hint={season.bestGain ? season.tournaments[season.bestGain.tournamentId]?.name : undefined}
        />
        <StatTile label="XP no ano" value={`+${season.xpGained}`} hint={`nível ${season.level} ao fim do ano`} />
        <StatTile label="Pódios" value={season.podiums.length} />
      </div>

      <section aria-label="Variação de rating" className="mt-6">
        <Announcement icon={ChartBarLineIcon} label="Variação de rating" className="text-sm" />
        <div className="grid grid-cols-3 gap-2 px-2 sm:gap-4 sm:px-4">
          {FORMATS.map(([format, label]) => {
            const change = season.ratingChange[format];
            return (
              <StatTile
                key={format}
                label={label}
                value={change === null ? "—" : signed(change)}
                valueClassName={cn(
                  change !== null && change > 0 && "text-emerald-700 dark:text-emerald-400",
                  change !== null && change < 0 && "text-rose-700 dark:text-rose-400",
                )}
                hint={change === null ? "sem torneios" : undefined}
              />
            );
          })}
        </div>
      </section>

      <section aria-label="Torneios por mês" className="mt-6">
        <Announcement icon={Calendar01Icon} label="Torneios por mês" className="text-sm" />
        <div className="px-2 sm:px-4">
          <ActivityGraph dates={season.days} years={[season.year]} />
        </div>
      </section>

      {season.podiums.length > 0 && (
        <section aria-label="Pódios" className="mt-6">
          <Announcement icon={Award01Icon} label="Pódios" className="text-sm" />
          <ul className="flex flex-col">
            {season.podiums.map((podium) => (
              <li key={`${podium.name}-${podium.category}-${podium.place}`} className="m-1">
                <div className="flex items-center gap-3 rounded-md p-3 text-sm transition-colors duration-200 hover:bg-muted/50">
                  <Medal place={podium.place as 1 | 2 | 3} />
                  <span className="min-w-0">
                    <span className="font-medium">{podium.name}</span>
                    {podium.category && <span className="text-muted-foreground"> · {podium.category}</span>}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {season.achievements.length > 0 && (
        <section aria-label="Conquistas do ano" className="mt-6">
          <Announcement icon={Target01Icon} label="Conquistas do ano" className="text-sm" />
          <ul className="flex flex-wrap gap-2 px-3" aria-label="Conquistas do ano">
            {season.achievements.map((achievement) => (
              <li key={achievement.id}>
                <AchievementBadge achievement={achievement} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Both slots always render so the year never jumps when one side has no season.
function SeasonLink({ id, year, direction }: { id: number; year?: number; direction: "previous" | "next" }) {
  const icon = direction === "previous" ? ArrowLeft01Icon : ArrowRight01Icon;
  const className = cn(buttonVariants({ variant: "outline", size: "sm" }), "min-w-24 gap-1 tabular-nums");
  if (year === undefined) {
    return (
      <span aria-hidden className={cn(className, "invisible")}>
        0000
      </span>
    );
  }
  return (
    <Link
      to="/jogadores/$id/temporada/$ano"
      params={{ id, ano: year }}
      aria-label={`Temporada ${year}`}
      className={cn(className, "active:scale-[0.96]")}
    >
      {direction === "previous" && <HugeiconsIcon icon={icon} className="size-4" aria-hidden />}
      {year}
      {direction === "next" && <HugeiconsIcon icon={icon} className="size-4" aria-hidden />}
    </Link>
  );
}
