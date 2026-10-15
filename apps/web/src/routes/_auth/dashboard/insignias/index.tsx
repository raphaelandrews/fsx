import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { EntityListPage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";
import { INSIGNIA_SECTIONS } from "@/lib/admin-forms";

export const Route = createFileRoute("/_auth/dashboard/insignias/")({
  head: () => ({ meta: [{ title: "Insignias - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.insignias.list.queryOptions()),
  component: RouteComponent,
});

type Row = ReturnType<typeof useRows>[number];

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "level",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.level}</span>,
  },
];

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.insignias.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.insignias.delete.mutationOptions(), {
    invalidates: "insignias",
    ...entityMessages("insignia").delete,
  });

  const createMutation = useAdminMutation(trpc.insignias.create.mutationOptions(), {
    invalidates: "insignias",
    ...entityMessages("insignia").create,
  });

  return (
    <EntityListPage
      noun="insignia"
      plural="insignias"
      basePath="/dashboard/insignias"
      title="Insignias"
      description="Manage insignias."
      rows={rows}
      columns={columns}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
      create={{
        description: "Add a badge players can earn.",
        sections: INSIGNIA_SECTIONS,
        defaultValues: { name: "", level: "1" },
        onSubmit: (values, close) =>
          createMutation.mutate(
            {
              name: values.name!,
              level: Number(values.level),
            },
            { onSuccess: close },
          ),
        error: createMutation.error,
        pending: createMutation.isPending,
      }}
    />
  );
}
