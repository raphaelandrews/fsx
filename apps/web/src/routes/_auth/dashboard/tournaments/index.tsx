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

export const Route = createFileRoute("/_auth/dashboard/tournaments/")({
  head: () => ({ meta: [{ title: "Tournaments - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tournaments.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data = [] } = useSuspenseQuery(trpc.tournaments.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.tournaments.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.tournaments.list.queryFilter());
      toast.success("Torneio excluído");
    },
    onError: () => toast.error("Falha ao excluir torneio"),
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.getValue("date")}</span>,
    },
    {
      accessorKey: "ratingType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
    },
    {
      accessorKey: "championship",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Campeonato" />,
      cell: ({ row }) => <span>{row.original.championship?.name ?? "—"}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          editTo="/dashboard/tournaments/$id"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.name}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Torneios"
        description="Gerencie os torneios oficiais."
        actions={
          <Link to="/dashboard/tournaments/create">
            <Button>Novo torneio</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Buscar torneio..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
