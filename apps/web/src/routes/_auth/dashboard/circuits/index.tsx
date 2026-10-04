import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { COMPETITION_TIER_LABELS, type CompetitionTier } from "@fsx/api/circuit-types";
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

export const Route = createFileRoute("/_auth/dashboard/circuits/")({
  head: () => ({ meta: [{ title: "Circuits - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.circuits.listSimple.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.circuits.listSimple.queryOptions());

  const deleteMutation = useAdminMutation(trpc.circuits.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Circuit deleted",
    failure: "Failed to delete circuit",
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
      cell: ({ row }) => <RowLink to="/dashboard/circuits/$id" id={row.original.id}>{row.getValue("name")}</RowLink>,
    },
    {
      accessorKey: "year",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Season" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.year ?? "—"}</span>,
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("type")}</span>,
    },
    {
      accessorKey: "tier",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tier" />,
      cell: ({ row }) => <span>{COMPETITION_TIER_LABELS[row.original.tier as CompetitionTier] ?? row.original.tier}</span>,
    },
    {
      accessorKey: "finishedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.finishedAt ? "Finished" : "In progress"}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/circuits/$id"
          noun="circuit"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Circuits"
        description="One circuit per season. Finished seasons keep their final podiums."
        actions={
          <Link to="/dashboard/circuits/create">
            <Button>New circuit</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="circuits" createTo="/dashboard/circuits/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Search circuit..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
