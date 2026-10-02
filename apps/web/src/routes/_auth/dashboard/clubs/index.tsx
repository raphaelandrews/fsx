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

export const Route = createFileRoute("/_auth/dashboard/clubs/")({
  head: () => ({ meta: [{ title: "Clubs - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.clubs.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.clubs.delete.mutationOptions(), {
    invalidates: "clubs",
    success: "Club deleted",
    failure: "Failed to delete club",
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
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/clubs/$id"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Clubs"
        description="Manage the member clubs."
        actions={
          <Link to="/dashboard/clubs/create">
            <Button>New club</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="clubs" createTo="/dashboard/clubs/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Search club..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
