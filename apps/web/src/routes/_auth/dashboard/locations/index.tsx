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

export const Route = createFileRoute("/_auth/dashboard/locations/")({
  head: () => ({ meta: [{ title: "Locations - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.locations.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.locations.delete.mutationOptions(), {
    invalidates: "locations",
    success: "Location deleted",
    failure: "Failed to delete location",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/locations/$id"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Locations"
        description="Manage cities and states."
        actions={
          <Link to="/dashboard/locations/create">
            <Button>New location</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="locations" createTo="/dashboard/locations/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Search location..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
