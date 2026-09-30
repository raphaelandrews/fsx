import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ChampionsTabs } from "@/components/campeoes/champions-tabs";
import type { ChampionTournament } from "@/components/campeoes/columns";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/campeoes")({
  head: () =>
    buildSeo({
      title: withBrand("Galeria de Campeões"),
      description:
        "Galeria dos campeões sergipanos de xadrez por torneio e categoria, com pódios completos.",
      path: "/campeoes",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Campeões", path: "/campeoes" },
      ]),
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.champions.gallery.queryOptions()),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: championships = [] } = useSuspenseQuery(trpc.champions.gallery.queryOptions());

  const championshipMap = championships.reduce<Record<string, ChampionTournament[]>>(
    (acc, championship) => {
      acc[championship.name] = championship.tournaments;
      return acc;
    },
    {},
  );

  return (
    <>
      <PageHeader title="Campeões" />
      <ChampionsTabs championshipMap={championshipMap} />
    </>
  );
}
