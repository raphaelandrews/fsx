import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Trophy } from "@hugeicons/core-free-icons";

import type { CompetitionTier } from "@fsx/api/circuit-types";
import type { RatingType } from "@fsx/api/rating-types";
import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { formatIsoDate } from "@/components/gamification/tier";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { StatTile } from "@/components/gamification/stat-tile";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { RHYTHM_LABELS, TIER_LABELS } from "@/components/torneios/labels";
import { TournamentPodium } from "@/components/torneios/tournament-podium";
import { TournamentResults } from "@/components/torneios/tournament-results";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { breadcrumbJsonLd, buildSeo, tournamentJsonLd, withBrand } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_public/torneios/$id")({
  params: idParams,
  loader: async ({ context, params }) => {
    const [tournament] = await Promise.all([
      orNotFound(context.queryClient.ensureQueryData(context.trpc.tournaments.byId.queryOptions({ id: params.id }))),
      context.queryClient.ensureQueryData(context.trpc.tournaments.results.queryOptions({ id: params.id })),
    ]);
    return { tournament };
  },
  head: ({ loaderData, params }) => {
    const tournament = loaderData?.tournament;
    const path = `/torneios/${params.id}`;
    if (!tournament) return buildSeo({ title: withBrand("Torneio"), path });
    const rhythm = RHYTHM_LABELS[tournament.ratingType as RatingType] ?? tournament.ratingType;
    const description = `${tournament.name}${tournament.date ? `, ${formatIsoDate(tournament.date)}` : ""}: campeões, classificação e variação de rating (${rhythm}) da Federação Sergipana de Xadrez.`;
    return buildSeo({
      title: withBrand(tournament.name),
      description,
      path,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Torneios", path: "/torneios" },
          { name: tournament.name, path },
        ]),
        tournamentJsonLd({ name: tournament.name, path, startDate: tournament.date, description }),
      ],
    });
  },
  pendingComponent: () => <PageSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const { data: tournament } = useSuspenseQuery(trpc.tournaments.byId.queryOptions({ id }));
  const { data: results } = useSuspenseQuery(trpc.tournaments.results.queryOptions({ id }));

  const details = [
    tournament.date ? formatIsoDate(tournament.date) : null,
    RHYTHM_LABELS[tournament.ratingType as RatingType] ?? tournament.ratingType,
    TIER_LABELS[tournament.tier as CompetitionTier] ?? tournament.tier,
  ].filter(Boolean);

  return (
    <>
      <nav aria-label="Você está em" className="pt-6 text-muted-foreground text-sm">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>
            <Link to="/torneios" className="link-inline">
              Torneios
            </Link>
          </li>
          {tournament.championship ? (
            <li className="flex items-center gap-2">
              <span aria-hidden>/</span>
              <Link to="/torneios" search={{ campeonato: tournament.championship.id }} className="link-inline">
                {tournament.championship.name}
              </Link>
            </li>
          ) : null}
        </ol>
      </nav>

      <PageHeader icon={Trophy} title={tournament.name} description={details.join(" · ")} />

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {tournament.chessResults ? (
          <a
            href={tournament.chessResults}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "active:scale-[0.96]")}
          >
            Ver no Chess-Results
            <HugeiconsIcon icon={ArrowUpRight01Icon} data-icon="inline-end" className="size-4" aria-hidden />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : null}
        {tournament.circuits.map((circuit) => (
          <Link
            key={circuit.id}
            to="/circuitos"
            search={{ ano: circuit.year ?? undefined, circuito: slugify(circuit.name) }}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "active:scale-[0.96]")}
          >
            Etapa de {circuit.name}
          </Link>
        ))}
      </div>

      {results.length > 0 ? (
        <div className="mb-8 grid grid-cols-2 gap-2 sm:gap-4">
          <StatTile label="Jogadores" value={results.length} hint="com rating atualizado" className={results[0]!.variation > 0 ? undefined : "col-span-2"} />
          {results[0]!.variation > 0 && (
            <StatTile label="Maior ganho" value={`+${results[0]!.variation}`} valueClassName="text-success" hint={results[0]!.name} />
          )}
        </div>
      ) : null}

      {tournament.tournamentPodiums.length > 0 ? (
        <section className="mb-10">
          <SectionHeading label="Pódio" icon={Trophy} className="px-0" />
          <TournamentPodium podiums={tournament.tournamentPodiums} results={results} />
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="mb-10">
          <SectionHeading label={`Variação de rating (${results.length})`} className="px-0" />
          <TournamentResults results={results} />
        </section>
      ) : null}

      {tournament.tournamentPodiums.length === 0 && results.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Os resultados deste torneio ainda não foram publicados.</p>
      ) : null}
    </>
  );
}
