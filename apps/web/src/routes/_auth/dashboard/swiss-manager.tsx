import { createFileRoute } from "@tanstack/react-router";

import { SwissManagerExport } from "@/components/swiss-manager/swiss-manager-export";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export const Route = createFileRoute("/_auth/dashboard/swiss-manager")({
  head: () => ({ meta: [{ title: "Swiss Manager - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.swissManager.list.queryOptions()),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <AdminPageHeader
        title="Swiss Manager"
        description="Export every player as a Swiss Manager-compatible Excel file. The file includes birth dates; keep it private."
      />
      <SwissManagerExport />
    </div>
  );
}
