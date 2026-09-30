import { createFileRoute } from "@tanstack/react-router";

import { SwissManagerExport } from "@/components/swiss-manager/swiss-manager-export";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/swiss-manager")({
  head: () =>
    buildSeo({
      title: withBrand("Swiss Manager"),
      description:
        "Gere arquivos Excel compatíveis com o Swiss Manager a partir dos torneios e jogadores cadastrados na FSX.",
      path: "/swiss-manager",
      noindex: true,
      canonical: false,
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.swissManager.list.queryOptions()),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <PageHeader
        title="Swiss Manager"
        description="Generate Swiss Manager-compatible Excel files."
      />
      <div className="flex justify-center">
        <SwissManagerExport />
      </div>
    </div>
  );
}
