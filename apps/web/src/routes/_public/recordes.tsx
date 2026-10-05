import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChampionIcon, ChartUpIcon, CrownIcon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";

import { Announcement } from "@/components/announcement";
import { PageHeader } from "@/components/page-header";
import { RecordCard } from "@/components/recordes/record-card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

const plural = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

const SECTIONS = [
  ["records-rating", "Rating"],
  ["records-titles", "Títulos e atividade"],
  ["records-champions", "Campeões"],
] as const;

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
      <PageHeader icon={ChampionIcon}
        title="Recordes"
        description="Os maiores feitos registrados pela FSX, de todos os jogadores, ativos ou não."
      />

      <nav aria-label="Seções" className="mb-8 flex flex-wrap justify-center gap-2">
        {SECTIONS.filter(([id]) => id !== "records-champions" || records.championships.length > 0).map(([id, label]) => (
          <a key={id} href={`#${id}`} className={buttonVariants({ variant: "secondary", size: "lg", className: "active:scale-[0.96]" })}>
            {label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-10">
        <section id="records-rating" aria-label="Rating" className="scroll-mt-24">
          <Announcement icon={ChartUpIcon} label="Rating" className="px-0" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
