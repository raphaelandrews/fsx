import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { EntityListPage, entityMessages } from "@/components/admin/entity-pages";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/roles/")({
  head: () => ({ meta: [{ title: "Roles - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.roles.list.queryOptions()),
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
];

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.roles.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.roles.delete.mutationOptions(), {
    invalidates: "roles",
    ...entityMessages("role").delete,
  });

  return (
    <EntityListPage
      noun="role"
      plural="roles"
      basePath="/dashboard/roles"
      title="Roles"
      description="Manage athletes' roles."
      rows={rows}
      columns={columns}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
    />
  );
}
