import { createFileRoute } from "@tanstack/react-router";

import { SwissManagerExport } from "@/components/swiss-manager/swiss-manager-export";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export const Route = createFileRoute("/swiss-manager")({
  head: () => ({
    meta: [
      { title: "Swiss Manager - FSX" },
      { name: "description", content: "Generate Swiss Manager-compatible Excel files." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.swissManager.list.queryOptions()),
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
