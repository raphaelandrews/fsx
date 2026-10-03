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
import { RowLink } from "@/components/data-table/row-link";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useAdminMutation } from "@/lib/admin-mutations";
import { EmptyCollection } from "@/components/admin/empty-collection";

export const Route = createFileRoute("/_auth/dashboard/tournaments/")({
  head: () => ({ meta: [{ title: "Tournaments - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tournaments.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.tournaments.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.tournaments.delete.mutationOptions(), {
    invalidates: "tournaments",
    success: "Tournament deleted",
    failure: "Failed to delete tournament",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <RowLink to="/dashboard/tournaments/$id" id={row.original.id}>{row.getValue("name")}</RowLink>,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.getValue("date")}</span>,
    },
    {
      accessorKey: "ratingType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
    },
    {
      accessorKey: "championship",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Championship" />,
      cell: ({ row }) => <span>{row.original.championship?.name ?? "—"}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/tournaments/$id"
          noun="tournament"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Tournaments"
        description="Manage the official tournaments."
        actions={
          <Link to="/dashboard/tournaments/create">
            <Button>New tournament</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="tournaments" createTo="/dashboard/tournaments/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Search tournament..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
