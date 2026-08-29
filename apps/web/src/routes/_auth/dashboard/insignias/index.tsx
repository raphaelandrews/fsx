import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

export const Route = createFileRoute("/_auth/dashboard/insignias/")({
  head: () => ({ meta: [{ title: "Insignias - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.insignias.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data = [] } = useSuspenseQuery(trpc.insignias.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.insignias.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.insignias.list.queryFilter());
      toast.success("Insígnia excluída");
    },
    onError: () => toast.error("Falha ao excluir insígnia"),
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "level",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nível" />,
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("level")}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          editTo="/dashboard/insignias/$id"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Insígnias"
        description="Gerencie as insígnias."
        actions={
          <Link to="/dashboard/insignias/create">
            <Button>Nova insígnia</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Buscar insígnia..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
