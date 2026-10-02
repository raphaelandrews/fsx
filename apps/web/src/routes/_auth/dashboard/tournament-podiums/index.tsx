import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useAdminMutation } from "@/lib/admin-mutations";
import { EmptyCollection } from "@/components/admin/empty-collection";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/")({
  head: () => ({ meta: [{ title: "Podiums - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tournamentPodiums.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.tournamentPodiums.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.tournamentPodiums.delete.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium deleted",
    failure: "Failed to delete podium",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "place",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Place" />,
      cell: ({ row }) => <span className="tabular-nums font-medium">{row.original.place}º</span>,
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
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/tournament-podiums/$id"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.player?.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Podiums"
        description="Manage tournament podiums."
        actions={
          <Link to="/dashboard/tournament-podiums/create">
            <Button>New podium</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="tournament podiums" createTo="/dashboard/tournament-podiums/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchPlaceholder="Search player..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
