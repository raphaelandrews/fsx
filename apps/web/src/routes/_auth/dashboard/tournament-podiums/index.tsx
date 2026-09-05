import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/")({
  head: () => ({ meta: [{ title: "Podiums - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tournamentPodiums.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data = [] } = useSuspenseQuery(trpc.tournamentPodiums.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.tournamentPodiums.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.tournamentPodiums.list.queryFilter());
      toast.success("Podium deleted");
    },
    onError: () => toast.error("Failed to delete podium"),
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
