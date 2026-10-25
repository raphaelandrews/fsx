import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { EntityListPage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { optionalNumber } from "@/components/admin/entity-form";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";
import { CATEGORY_SECTIONS } from "@/lib/admin-forms";

export const Route = createFileRoute("/_auth/dashboard/categories/")({
  head: () => ({ meta: [{ title: "Categories - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.categories.list.queryOptions()),
  component: RouteComponent,
});

type Row = ReturnType<typeof useRows>[number];

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "kind",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
  },
  {
    accessorKey: "sortOrder",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.sortOrder}</span>,
  },
];

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.categories.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.categories.delete.mutationOptions(), {
    invalidates: "categories",
    ...entityMessages("category").delete,
  });
  const createMutation = useAdminMutation(trpc.categories.create.mutationOptions(), {
    invalidates: "categories",
    ...entityMessages("category").create,
  });

  return (
    <EntityListPage
      noun="category"
      plural="categories"
      basePath="/dashboard/categories"
      title="Categories"
      description="Competition categories used by podiums and circuit results."
      rows={rows}
      columns={columns}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
      create={{
        description: "Add a category such as Sub 20 Masculino.",
        sections: CATEGORY_SECTIONS,
        defaultValues: { name: "", kind: "age", sex: "male", ageLimit: "", sortOrder: String(rows.length + 1) },
        onSubmit: (values, close) =>
          createMutation.mutate(
            {
              name: values.name!,
              kind: values.kind as "age" | "open",
              sex: values.kind === "age" ? (values.sex as "male" | "female") : null,
              ageLimit: values.kind === "age" ? optionalNumber(values.ageLimit!) : null,
              sortOrder: Number(values.sortOrder),
            },
            { onSuccess: close },
          ),
        error: createMutation.error,
        pending: createMutation.isPending,
      }}
    />
  );
}
