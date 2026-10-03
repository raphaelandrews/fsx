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

export const Route = createFileRoute("/_auth/dashboard/links/")({
  head: () => ({ meta: [{ title: "Links - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.links.list.queryOptions());
  const groups = data.filter((group) => group.eventId == null);

  const deleteMutation = useAdminMutation(trpc.links.deleteGroup.mutationOptions(), {
    invalidates: "links",
    success: "Group deleted",
    failure: "Failed to delete group",
  });

  const columns: ColumnDef<(typeof groups)[number]>[] = [
    {
      accessorKey: "label",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
      cell: ({ row }) => (
        <RowLink to="/dashboard/links/$id" id={row.original.id}>
          {row.original.label}
        </RowLink>
      ),
    },
    {
      id: "links",
      accessorFn: (group) => group.links.length,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Links" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.links.length}</span>,
    },
    {
      id: "preview",
      header: "Contains",
      cell: ({ row }) => (
        <span className="line-clamp-1 text-muted-foreground">
          {row.original.links.map((link) => link.label).join(", ") || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          editTo="/dashboard/links/$id"
          noun="link group"
          displayName={row.original.label}
          isDeleting={deleteMutation.isPending}
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Links"
        description="Link groups shown on the public /links page. Event links are edited with their event."
        actions={
          <Link to="/dashboard/links/create" className={buttonVariants()}>
            New group
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={groups}
        emptyState={<EmptyCollection noun="link groups" createTo="/dashboard/links/create" />}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="label" searchPlaceholder="Search group..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </>
  );
}
