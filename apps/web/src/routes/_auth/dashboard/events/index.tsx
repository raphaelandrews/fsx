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

export const Route = createFileRoute("/_auth/dashboard/events/")({
  head: () => ({ meta: [{ title: "Events - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.events.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.events.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.events.delete.mutationOptions(), {
    invalidates: "events",
    success: "Event deleted",
    failure: "Failed to delete event",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <RowLink to="/dashboard/events/$id" id={row.original.id}>{row.getValue("name")}</RowLink>,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Start" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("startDate")}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/events/$id"
          noun="event"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Events"
        description="Manage the official events."
        actions={
          <Link to="/dashboard/events/create">
            <Button>New event</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="events" createTo="/dashboard/events/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Search event..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
