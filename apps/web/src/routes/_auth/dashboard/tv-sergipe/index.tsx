import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@fsx/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@fsx/ui/components/alert-dialog";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

export const Route = createFileRoute("/_auth/dashboard/tv-sergipe/")({
  head: () => ({ meta: [{ title: "TV Sergipe - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tvSergipe.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const { data = [] } = useSuspenseQuery(trpc.tvSergipe.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.tvSergipe.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.tvSergipe.list.queryFilter());
      toast.success("Resultado excluído");
    },
    onError: () => toast.error("Falha ao excluir resultado"),
  });

  const deleteAllMutation = useMutation({
    ...trpc.tvSergipe.deleteAll.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.tvSergipe.list.queryFilter());
      toast.success("Todos os resultados excluídos");
    },
    onError: () => toast.error("Falha ao excluir todos os resultados"),
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "club",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Escola" />,
      cell: ({ row }) => <span className="font-medium">{row.original.club?.name ?? "—"}</span>,
    },
    {
      accessorKey: "ageGroup",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.ageGroup}</span>,
    },
    {
      accessorKey: "sex",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sexo" />,
      cell: ({ row }) => <span>{row.original.sex === "male" ? "Masculino" : "Feminino"}</span>,
    },
    {
      accessorKey: "modality",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modalidade" />,
      cell: ({ row }) => <span>{row.original.modality === "team" ? "Equipe" : "Individual"}</span>,
    },
    {
      accessorKey: "teamName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Equipe" />,
      cell: ({ row }) => <span>{row.original.teamName ?? "—"}</span>,
    },
    {
      accessorKey: "player",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jogador" />,
      cell: ({ row }) => <span>{row.original.player?.name ?? "—"}</span>,
    },
    {
      accessorKey: "place",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lugar" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.place}º</span>,
    },
    {
      accessorKey: "points",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pontos" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.points}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          editTo="/dashboard/tv-sergipe/$id"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="TV Sergipe"
        description="Resultados dos Jogos Escolares TV Sergipe."
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setConfirmDeleteAll(true)}>
              Excluir todos
            </Button>
            <Link to="/dashboard/tv-sergipe/create">
              <Button>Novo resultado</Button>
            </Link>
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchPlaceholder="Buscar resultado..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />

      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todos os resultados?</AlertDialogTitle>
            <AlertDialogDescription>Isso não pode ser desfeito.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteAllMutation.mutate()}>
              Excluir todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
