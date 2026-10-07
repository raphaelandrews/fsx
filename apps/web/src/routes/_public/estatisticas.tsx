import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Analytics01Icon, ChampionIcon, ChartUpIcon, CrownIcon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";

import { Announcement } from "@/components/announcement";
import { StatTile } from "@/components/gamification/stat-tile";
import { PageHeader } from "@/components/page-header";
import { RecordCard } from "@/components/recordes/record-card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { StatisticsCharts } from "@/components/statistics-charts";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

const plural = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;
const number = new Intl.NumberFormat("pt-BR");

const SECTIONS = [
  ["statistics-overview", "Panorama"],
  ["records-rating", "Rating"],
  ["records-titles", "Títulos e atividade"],
  ["records-champions", "Campeões"],
] as const;

export const Route = createFileRoute("/_public/estatisticas")({
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
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(context.trpc.records.all.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.records.statistics.queryOptions()),
    ]),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: records } = useSuspenseQuery(trpc.records.all.queryOptions());
  const { data: statistics } = useSuspenseQuery(trpc.records.statistics.queryOptions());
  const rating = (value: number) => String(value);
  const firstYear = statistics.tournaments.firstDate?.slice(0, 4);
  const lastYear = statistics.tournaments.lastDate?.slice(0, 4);
  const tournamentYears = firstYear && lastYear
    ? firstYear === lastYear ? firstYear : `${firstYear}–${lastYear}`
    : "Sem datas registradas";
  const femaleShare = statistics.players.active > 0
    ? Math.round((statistics.players.femaleActive / statistics.players.active) * 100)
    : 0;

  return (
    <>
      <PageHeader
        icon={Analytics01Icon}
        title="Estatísticas"
        description="Um panorama do xadrez em Sergipe, construído a partir dos dados registrados pela FSX."
      />

      <nav aria-label="Seções" className="mb-8 flex flex-wrap justify-center gap-2">
        {SECTIONS.filter(([id]) => id !== "records-champions" || records.championships.length > 0).map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={buttonVariants({ variant: "default", size: "lg", className: "active:scale-[0.96]" })}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-10">
        <section id="statistics-overview" aria-label="Panorama geral" className="scroll-mt-24">
          <Announcement icon={Analytics01Icon} label="O xadrez em Sergipe, em números" className="px-0" />
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

        <section id="records-rating" aria-label="Rating" className="scroll-mt-24">
          <Announcement icon={ChartUpIcon} label="Recordes de rating" className="px-0" />
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

        <section id="records-titles" aria-label="Títulos e atividade" className="scroll-mt-24">
          <Announcement icon={ChampionIcon} label="Títulos e atividade" className="px-0" />
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
          <section id="records-champions" aria-label="Maiores campeões por campeonato" className="scroll-mt-24">
            <Announcement icon={CrownIcon} label="Maiores campeões por campeonato" className="px-0" />
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
    </>
  );
}
