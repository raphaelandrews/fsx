import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { TitledPlayersTable } from "@/components/titulados/titled-players-table";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/titulados")({
  head: () =>
    buildSeo({
      title: withBrand("Jogadores Titulados"),
      description: "Jogadores de Sergipe com títulos nacionais e FIDE de xadrez (MN, MI, MF, CM).",
      path: "/titulados",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Titulados", path: "/titulados" },
      ]),
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.titledPlayers.list.queryOptions()),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: titledPlayers = [] } = useSuspenseQuery(trpc.titledPlayers.list.queryOptions());

  return (
    <>
      <PageHeader title="Titulados" />
      <TitledPlayersTable data={titledPlayers} />
    </>
  );
}
