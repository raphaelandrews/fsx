import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";
import { padNumber } from "@/utils/format";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { RowLink } from "@/components/data-table/row-link";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useAdminMutation } from "@/lib/admin-mutations";
import { EmptyCollection } from "@/components/admin/empty-collection";

export const Route = createFileRoute("/_auth/dashboard/announcements/")({
  head: () => ({ meta: [{ title: "Announcements - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.announcements.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.announcements.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.announcements.delete.mutationOptions(), {
    invalidates: "announcements",
    success: "Announcement deleted",
    failure: "Failed to delete announcement",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "year",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Year" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("year")}</span>,
    },
    {
      accessorKey: "number",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Number" />,
      cell: ({ row }) => (
        <RowLink to="/dashboard/announcements/$id" id={row.original.id}>
          <span className="tabular-nums">{padNumber(row.original.number)}/{row.original.year}</span>
        </RowLink>
      ),
    },
    {
      accessorKey: "content",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Content" />,
      cell: ({ row }) => <span className="max-w-xs truncate block">{row.getValue("content")}</span>,
    },
    {
      accessorKey: "playerName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.playerName ?? "—"}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/announcements/$id"
          noun="announcement"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={`Comunicado ${padNumber(row.original.number)}/${row.original.year}`}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description="Manage the official announcements."
        actions={
          <Link to="/dashboard/announcements/create">
            <Button>New announcement</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="announcements" createTo="/dashboard/announcements/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="content" searchPlaceholder="Search announcement..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
