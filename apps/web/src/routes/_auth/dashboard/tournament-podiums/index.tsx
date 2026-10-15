import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/lib/trpc";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { RowLink } from "@/components/data-table/row-link";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useAdminMutation } from "@/lib/admin-mutations";
import { EmptyCollection } from "@/components/admin/empty-collection";
import { PodiumCreateDialog } from "@/components/admin/create-dialogs";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/")({
  head: () => ({ meta: [{ title: "Podiums - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tournamentPodiums.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const [creating, setCreating] = useState(false);
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.tournamentPodiums.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.tournamentPodiums.delete.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium deleted",
    failure: "Failed to delete podium",
  });

  const [bulk, setBulk] = useState<{ ids: number[]; clear: () => void } | null>(null);
  const bulkDelete = useAdminMutation(trpc.tournamentPodiums.bulkDelete.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podiums deleted",
    failure: "Failed to delete the podiums",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "place",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Place" />,
      cell: ({ row }) => <RowLink to="/dashboard/tournament-podiums/$id" id={row.original.id}><span className="tabular-nums">{row.original.place}º</span></RowLink>,
    },
    {
      accessorKey: "player",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
      cell: ({ row }) => <span>{row.original.player?.name ?? "—"}</span>,
    },
    {
      accessorKey: "tournament",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tournament" />,
      cell: ({ row }) => <span>{row.original.tournament?.name ?? "—"}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.category ?? "Overall"}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/tournament-podiums/$id"
          noun="podium"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.player?.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Tournament podiums"
        description="Manage tournament podiums."
        actions={
          <Button onClick={() => setCreating(true)}>New podium</Button>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="tournament podiums" onCreate={() => setCreating(true)} />}
        columns={columns}
        data={data}
        bulkActions={(selected, clear) => (
          <Button type="button" size="sm" variant="outline" onClick={() => setBulk({ ids: selected.map((podium) => podium.id), clear })}>
            Delete selected…
          </Button>
        )}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchPlaceholder="Search player..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
      <DeleteDialog
        open={bulk !== null}
        onOpenChange={(open) => !open && setBulk(null)}
        title={`Delete ${bulk?.ids.length ?? 0} ${bulk?.ids.length === 1 ? "podium" : "podiums"}?`}
        description="The podiums leave their tournaments, the champions gallery, and the players’ medal counts. This cannot be undone."
        confirmText={(bulk?.ids.length ?? 0) > 1 ? "delete" : undefined}
        confirmLabel="Delete podiums"
        pending={bulkDelete.isPending}
        onConfirm={() => {
          if (!bulk) return;
          bulkDelete.mutate({ ids: bulk.ids });
          bulk.clear();
        }}
      />
      <PodiumCreateDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
