import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { buttonVariants } from "@fsx/ui/components/button";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyCollection } from "@/components/admin/empty-collection";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { RowLink } from "@/components/data-table/row-link";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/championships/")({
  head: () => ({ meta: [{ title: "Championships - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.champions.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.champions.delete.mutationOptions(), {
    invalidates: "champions",
    success: "Championship deleted",
    failure: "Failed to delete championship",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <RowLink to="/dashboard/championships/$id" id={row.original.id}>
          {row.original.name}
        </RowLink>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          editTo="/dashboard/championships/$id"
          noun="championship"
          displayName={row.original.name}
          isDeleting={deleteMutation.isPending}
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Championships"
        description="Recurring competitions. Their tournaments' podiums feed the champions gallery."
        actions={
          <Link to="/dashboard/championships/create" className={buttonVariants()}>
            New championship
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        emptyState={
          <EmptyCollection noun="championships" createTo="/dashboard/championships/create" />
        }
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchKey="name"
            searchPlaceholder="Search championship..."
          />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </>
  );
}
