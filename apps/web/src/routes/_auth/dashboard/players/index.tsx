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

export const Route = createFileRoute("/_auth/dashboard/players/")({
  head: () => ({ meta: [{ title: "Players - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.players.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [deactivateId, setDeactivateId] = useState<number | null>(null);

  const { data = [] } = useSuspenseQuery(trpc.players.list.queryOptions());

  const deactivateMutation = useMutation({
    ...trpc.players.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.players.list.queryFilter());
      toast.success("Jogador desativado");
    },
    onError: () => toast.error("Falha ao desativar jogador"),
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "nickname",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Apelido" />,
      cell: ({ row }) => <span>{row.getValue("nickname") ?? "—"}</span>,
    },
    {
      accessorKey: "blitz",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Blitz" />,
      cell: ({ row }) => <span className="text-right tabular-nums">{row.getValue("blitz") ?? "—"}</span>,
    },
    {
      accessorKey: "rapid",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rapid" />,
      cell: ({ row }) => <span className="text-right tabular-nums">{row.getValue("rapid") ?? "—"}</span>,
    },
    {
      accessorKey: "classic",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Classic" />,
      cell: ({ row }) => <span className="text-right tabular-nums">{row.getValue("classic") ?? "—"}</span>,
    },
    {
      accessorKey: "club",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clube" />,
      cell: ({ row }) => <span>{row.original.club?.name ?? "—"}</span>,
    },
    {
      accessorKey: "location",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Localidade" />,
      cell: ({ row }) => <span>{row.original.location?.name ?? "—"}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to="/dashboard/players/titles"
            search={{ playerId: row.original.id }}
          >
            <Button size="sm" variant="outline">Títulos</Button>
          </Link>
          <DataTableRowActions
            id={row.original.id}
            editTo="/dashboard/players/$id"
            onDelete={() => setDeactivateId(row.original.id)}
            displayName={row.original.name}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Jogadores"
        description="Gerencie os jogadores do estado."
        actions={
          <Link to="/dashboard/players/create">
            <Button>Novo jogador</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="name" searchPlaceholder="Buscar jogador..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />

      <AlertDialog open={deactivateId !== null} onOpenChange={(open) => { if (!open) setDeactivateId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar jogador?</AlertDialogTitle>
            <AlertDialogDescription>
              O jogador continuará no banco de dados, mas não aparecerá como ativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deactivateId !== null) deactivateMutation.mutate({ id: deactivateId, active: false });
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
