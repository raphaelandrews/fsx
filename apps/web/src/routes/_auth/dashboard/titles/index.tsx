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

export const Route = createFileRoute("/_auth/dashboard/titles/")({
  head: () => ({ meta: [{ title: "Titles - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());

  const deleteMutation = useAdminMutation(trpc.titles.delete.mutationOptions(), {
    invalidates: "titles",
    success: "Title deleted",
    failure: "Failed to delete title",
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
      cell: ({ row }) => <RowLink to="/dashboard/titles/$id" id={row.original.id}>{row.getValue("name")}</RowLink>,
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
      accessorKey: "tier",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tier" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.tier}</span>,
    },
    {
      accessorKey: "losesAtAge",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lost at age" />,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.losesAtAge ?? "—"}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/titles/$id"
          noun="title"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Titles"
        description="Manage chess titles."
        actions={
          <Link to="/dashboard/titles/create">
            <Button>New title</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="titles" createTo="/dashboard/titles/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Search title..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
