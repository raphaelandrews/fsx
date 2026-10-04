import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/page-header";
import { RecordCard } from "@/components/recordes/record-card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

const plural = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

export const Route = createFileRoute("/_public/recordes")({
  head: () =>
    buildSeo({
      title: withBrand("Recordes"),
      description:
        "Recordes do xadrez sergipano: maiores ratings, mais títulos e pódios, maiores sequências e ganhos de rating, com todos os jogadores da história da FSX.",
      path: "/recordes",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Recordes", path: "/recordes" },
      ]),
    }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.records.all.queryOptions()),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: records } = useSuspenseQuery(trpc.records.all.queryOptions());
  const rating = (value: number) => String(value);

  return (
    <>
      <PageHeader
        title="Recordes"
        description="Os maiores feitos registrados pela FSX, de todos os jogadores, ativos ou não."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <RecordCard title="Maior rating · Clássico" entries={records.peaks.classic} format={rating} />
        <RecordCard title="Maior rating · Rápido" entries={records.peaks.rapid} format={rating} />
        <RecordCard title="Maior rating · Blitz" entries={records.peaks.blitz} format={rating} />
        <RecordCard title="Mais títulos" entries={records.wins} format={(v) => plural(v, "título", "títulos")} />
        <RecordCard title="Mais pódios" entries={records.podiums} format={(v) => plural(v, "pódio", "pódios")} />
        <RecordCard title="Maior ganho em um torneio" entries={records.gains} format={(v) => `+${v}`} />
        <RecordCard
          title="Maior sequência subindo"
          entries={records.streaks}
          format={(v) => plural(v, "torneio", "torneios")}
        />
        <RecordCard
          title={`Mais ativos em ${records.year}`}
          entries={records.activeThisYear}
          format={(v) => plural(v, "torneio", "torneios")}
        />
        <RecordCard title="Maiores níveis" entries={records.levels} format={(v) => `Nível ${v}`} />
      </div>

      {records.championships.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 font-semibold text-lg">Maiores campeões por campeonato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
        </>
      )}
    </>
  );
}
