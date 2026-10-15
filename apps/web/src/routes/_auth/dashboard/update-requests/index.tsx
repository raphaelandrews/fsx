import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@fsx/ui/components/badge";
import { Button } from "@fsx/ui/components/button";

import { DeleteDialog } from "@/components/admin/delete-dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { RowLink } from "@/components/data-table/row-link";
import { useAdminMutation } from "@/lib/admin-mutations";
import { parseDbTimestamp } from "@/lib/format";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/update-requests/")({
  head: () => ({ meta: [{ title: "Update requests - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.playerRequests.list.queryOptions()),
  component: RouteComponent,
});

type Row = ReturnType<typeof useRows>[number];

const FIELD_LABELS = [
  ["birthYear", "birth year"],
  ["clubId", "club"],
  ["locationId", "location"],
  ["cbxId", "CBX ID"],
  ["fideId", "FIDE ID"],
] as const;

// Mirrors RETENTION_DAYS on the server, which does the actual deletion.
const RETENTION_DAYS = 90;

const sentAt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.playerRequests.list.queryOptions()).data;
}

const columns: ColumnDef<Row>[] = [
  {
    id: "player",
    accessorFn: (row) => row.player.name,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
    cell: ({ row }) => (
      <RowLink to="/dashboard/update-requests/$id" id={row.original.id}>
        {row.original.player.name}
      </RowLink>
    ),
  },
  {
    id: "changes",
    header: "Proposes",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {FIELD_LABELS.filter(([key]) => row.original[key] !== null)
          .map(([, label]) => label)
          .join(", ")}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status === "pending" ? "default" : row.original.status === "rejected" ? "destructive" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sent" />,
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{sentAt.format(parseDbTimestamp(row.original.createdAt))}</span>,
  },
];

function RouteComponent() {
  const rows = useRows();
  const pending = rows.filter((row) => row.status === "pending");
  const [showReviewed, setShowReviewed] = useState(false);
  const [confirmingCleanup, setConfirmingCleanup] = useState(false);
  const data = showReviewed || pending.length === 0 ? rows : pending;

  const trpc = useTRPC();
  const old = rows.filter(
    (row) => row.status !== "pending" && row.reviewedAt && Date.now() - parseDbTimestamp(row.reviewedAt).getTime() > RETENTION_DAYS * 86_400_000,
  ).length;
  const cleanup = useAdminMutation(trpc.playerRequests.deleteReviewed.mutationOptions(), {
    invalidates: "playerRequests",
    success: "Old requests deleted",
    failure: "Failed to delete the old requests",
  });

  return (
    <div>
      <AdminPageHeader
        title="Update requests"
        description="Players and guardians propose corrections to their own record at /atualizar-cadastro. Nothing changes until you approve it."
        actions={
          <>
            {old > 0 ? (
              <Button variant="destructive" loading={cleanup.isPending} onClick={() => setConfirmingCleanup(true)}>
                Delete old decisions ({old})
              </Button>
            ) : null}
            {rows.length > pending.length ? (
              <Button variant="outline" aria-pressed={showReviewed} onClick={() => setShowReviewed((value) => !value)}>
                {showReviewed ? "Only pending" : `Show reviewed (${rows.length - pending.length})`}
              </Button>
            ) : null}
          </>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        emptyState="No update requests yet."
        pagination={(table) => <DataTablePagination table={table} />}
      />
      <DeleteDialog
        open={confirmingCleanup}
        onOpenChange={setConfirmingCleanup}
        title="Delete old decisions?"
        description={`${old} approved or rejected request${old === 1 ? "" : "s"} decided more than ${RETENTION_DAYS} days ago will be deleted, together with their proposed data. Pending requests are never touched. This cannot be undone.`}
        confirmLabel="Delete old decisions"
        pending={cleanup.isPending}
        onConfirm={() => cleanup.mutate({ olderThanDays: RETENTION_DAYS })}
      />
    </div>
  );
}
