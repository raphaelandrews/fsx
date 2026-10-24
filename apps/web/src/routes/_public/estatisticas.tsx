import { createFileRoute, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Analytics01Icon, Award01Icon, ChampionIcon, ChartUpIcon, CrownIcon } from "@hugeicons/core-free-icons";

import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { SectionHeading } from "@/components/section-heading";
import { BadgeCensus } from "@/components/gamification/badge-census";
import { StatTile } from "@/components/gamification/stat-tile";
import { PageHeader } from "@/components/page-header";
import { RecordCard } from "@/components/recordes/record-card";
import { StatsSkeleton } from "@/components/skeletons/stats-skeleton";
import { StatisticsCharts } from "@/components/recordes/statistics-charts";
import { statisticsSearchSchema } from "@/lib/search-schemas";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/lib/trpc";

const plural = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;
const number = new Intl.NumberFormat("pt-BR");

export const Route = createFileRoute("/_public/estatisticas")({
  validateSearch: statisticsSearchSchema,
  search: { middlewares: [stripSearchParams({ aba: "panorama" })] },
  head: () =>
    buildSeo({
      title: withBrand("Estatísticas"),
      description:
        "Estatísticas do xadrez sergipano: jogadores, torneios, participação, pódios e recordes históricos da FSX.",
      path: "/estatisticas",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Estatísticas", path: "/estatisticas" },
      ]),
    }),
  loaderDeps: ({ search }) => ({ aba: search.aba }),
  loader: ({ context, deps }) => {
    const { queryClient, trpc } = context;
    if (deps.aba === "recordes") return queryClient.ensureQueryData(trpc.records.all.queryOptions());
    if (deps.aba === "emblemas") return queryClient.ensureQueryData(trpc.records.badgeStats.queryOptions());
    return queryClient.ensureQueryData(trpc.records.statistics.queryOptions());
  },
  pendingComponent: () => <StatsSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { aba } = Route.useSearch();

  return (
    <>
      <PageHeader
        icon={Analytics01Icon}
        title="Estatísticas"
        description="Um panorama do xadrez em Sergipe, construído a partir dos dados registrados pela FSX."
      />

      <Tabs
        className="mb-8 w-full"
        value={aba}
        onValueChange={(value) => navigate({ to: "/estatisticas", search: { aba: value as typeof aba } })}
      >
        <div className="flex justify-center">
          <TabsList aria-label="Seções das estatísticas">
            <TabsTrigger value="panorama">Panorama</TabsTrigger>
            <TabsTrigger value="recordes">Recordes</TabsTrigger>
            <TabsTrigger value="emblemas">Emblemas</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {aba === "panorama" && <Overview />}
      {aba === "recordes" && <Records />}
      {aba === "emblemas" && <Badges />}
    </>
  );
}

function Overview() {
  const trpc = useTRPC();
  const { data: statistics } = useSuspenseQuery(trpc.records.statistics.queryOptions());
  const firstYear = statistics.tournaments.firstDate?.slice(0, 4);
  const lastYear = statistics.tournaments.lastDate?.slice(0, 4);
  const tournamentYears = firstYear && lastYear
    ? firstYear === lastYear ? firstYear : `${firstYear}–${lastYear}`
    : "Sem datas registradas";
  const femaleShare = statistics.players.active > 0
    ? Math.round((statistics.players.femaleActive / statistics.players.active) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-10">
    <section aria-label="Panorama geral" >
      <SectionHeading icon={Analytics01Icon} label="O xadrez em Sergipe, em números" className="px-0" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Jogadores ativos"
          value={number.format(statistics.players.active)}
          hint={`${number.format(statistics.players.total)} cadastrados`}
        />
        <StatTile
          label="Jogadoras ativas"
          value={number.format(statistics.players.femaleActive)}
          hint={`${femaleShare}% dos jogadores ativos · ranking Feminino`}
        />
        <StatTile
          label="Torneios registrados"
          value={number.format(statistics.tournaments.total)}
          hint={tournamentYears}
        />
        <StatTile
          label="Resultados de rating"
          value={number.format(statistics.ratingResults)}
          hint="por jogador e torneio"
        />
        <StatTile
          label="Pódios registrados"
          value={number.format(statistics.tournamentPodiums)}
          hint="gerais e por categoria"
        />
        <StatTile
          label="Circuitos concluídos"
          value={number.format(statistics.completedCircuits)}
          hint="temporadas com resultado oficial"
        />
        <StatTile label="Clubes cadastrados" value={number.format(statistics.clubs)} />
        <StatTile
          label="Cidades representadas"
          value={number.format(statistics.citiesRepresented)}
          hint="entre jogadores ativos"
        />
      </div>
      <p className="mt-3 text-center text-muted-foreground text-sm">
        Contagens baseadas nos registros disponíveis; históricos incompletos podem alterar os totais.
      </p>
    </section>

    <section aria-label="Gráficos do xadrez sergipano">
      <StatisticsCharts
        ratingsByThreshold={statistics.ratingsByThreshold}
        tournamentsByTier={statistics.tournamentsByTier}
      />
    </section>

    </div>
  );
}

function Records() {
  const trpc = useTRPC();
  const { data: records } = useSuspenseQuery(trpc.records.all.queryOptions());
  const rating = (value: number) => String(value);

  return (
    <div className="flex flex-col gap-10">
    <section aria-label="Rating">
      <SectionHeading icon={ChartUpIcon} label="Recordes de rating" className="px-0" />
      <div className="grid gap-3 sm:grid-cols-2">
        <RecordCard title="Maior rating · Clássico" entries={records.peaks.classic} format={rating} />
        <RecordCard title="Maior rating · Rápido" entries={records.peaks.rapid} format={rating} />
        <RecordCard title="Maior rating · Blitz" entries={records.peaks.blitz} format={rating} />
        <RecordCard title="Maior ganho em um torneio" entries={records.gains} format={(v) => `+${v}`} />
        <RecordCard
          title="Maior sequência subindo"
          entries={records.streaks}
          format={(v) => plural(v, "torneio", "torneios")}
        />
      </div>
    </section>

    <section aria-label="Títulos e atividade">
      <SectionHeading icon={ChampionIcon} label="Títulos e atividade" className="px-0" />
      <div className="grid gap-3 sm:grid-cols-2">
        <RecordCard title="Mais títulos" entries={records.wins} format={(v) => plural(v, "título", "títulos")} />
        <RecordCard title="Mais pódios" entries={records.podiums} format={(v) => plural(v, "pódio", "pódios")} />
        <RecordCard
          title={`Mais ativos em ${records.year}`}
          entries={records.activeThisYear}
          format={(v) => plural(v, "torneio", "torneios")}
        />
        <RecordCard title="Maiores níveis" entries={records.levels} format={(v) => `Nível ${v}`} />
      </div>
    </section>

    {records.championships.length > 0 && (
      <section aria-label="Maiores campeões por campeonato">
        <SectionHeading icon={CrownIcon} label="Maiores campeões por campeonato" className="px-0" />
        <div className="grid gap-3 sm:grid-cols-2">
          {records.championships.map((championship) => (
            <RecordCard
              key={championship.championshipId}
              title={championship.name}
              entries={championship.holders}
              format={(v) => plural(v, "título", "títulos")}
              detail={(entry) => entry.detail}
            />
          ))}
        </div>
      </section>
    )}

    </div>
  );
}

function Badges() {
  const trpc = useTRPC();
  const { data: badgeStats } = useSuspenseQuery(trpc.records.badgeStats.queryOptions());
  if (badgeStats.badges.length === 0) return null;

  return (
    <section aria-label="Emblemas">
      <SectionHeading icon={Award01Icon} label="Emblemas e quem os conquistou" className="px-0" />
      <p className="mb-4 text-pretty text-center text-muted-foreground text-sm">
        Todos os emblemas que existem, inclusive os que ninguém conquistou ainda. Percentual sobre{" "}
        {number.format(badgeStats.players)} jogadores com ao menos um torneio.
      </p>
      <BadgeCensus badges={badgeStats.badges} players={badgeStats.players} />
    </section>
  );
}
