import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { EntityListPage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/titles/")({
  head: () => ({ meta: [{ title: "Titles - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
  component: RouteComponent,
});

type Row = ReturnType<typeof useRows>[number];

const columns: ColumnDef<Row>[] = [
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
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">{row.original.losesAtAge ?? "—"}</span>
    ),
  },
];

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.titles.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.titles.delete.mutationOptions(), {
    invalidates: "titles",
    ...entityMessages("title").delete,
  });

  return (
    <EntityListPage
      noun="title"
      plural="titles"
      basePath="/dashboard/titles"
      title="Titles"
      description="Manage chess titles."
      rows={rows}
      columns={columns}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
    />
  );
}
