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

export const Route = createFileRoute("/_auth/dashboard/roles/")({
  head: () => ({ meta: [{ title: "Roles - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.roles.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.roles.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.roles.delete.mutationOptions(), {
    invalidates: "roles",
    success: "Role deleted",
    failure: "Failed to delete role",
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
      cell: ({ row }) => <RowLink to="/dashboard/roles/$id" id={row.original.id}>{row.getValue("name")}</RowLink>,
    },
    {
      accessorKey: "shortName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Abbreviation" />,
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
          editTo="/dashboard/roles/$id"
          noun="role"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Roles"
        description="Manage athletes' roles."
        actions={
          <Link to="/dashboard/roles/create">
            <Button>New role</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="roles" createTo="/dashboard/roles/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Search role..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
