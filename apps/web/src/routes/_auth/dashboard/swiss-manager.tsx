import { createFileRoute } from "@tanstack/react-router";

import { SwissManagerExport } from "@/components/swiss-manager/swiss-manager-export";
import { AdminPageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/_auth/dashboard/swiss-manager")({
  head: () => ({ meta: [{ title: "Swiss Manager - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <AdminPageHeader
        title="Swiss Manager"
        description="Export every player as a Swiss Manager-compatible Excel file. The same export is public at /swiss-manager."
      />
      <SwissManagerExport />
    </div>
  );
}
