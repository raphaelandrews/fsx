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
      qc.invalidateQueries(trpc.tvSergipe.leaderboard.queryFilter());
      toast.success("Result deleted");
    },
    onError: () => toast.error("Failed to delete result"),
  });

  const deleteAllMutation = useMutation({
    ...trpc.tvSergipe.deleteAll.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.tvSergipe.list.queryFilter());
      qc.invalidateQueries(trpc.tvSergipe.leaderboard.queryFilter());
      toast.success("All results deleted");
    },
    onError: () => toast.error("Failed to delete all results"),
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "club",
      header: ({ column }) => <DataTableColumnHeader column={column} title="School" />,
      cell: ({ row }) => <span className="font-medium">{row.original.club?.name ?? "—"}</span>,
    },
    {
      accessorKey: "ageGroup",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.ageGroup}</span>,
    },
    {
      accessorKey: "sex",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sex" />,
      cell: ({ row }) => <span>{row.original.sex === "male" ? "Male" : "Female"}</span>,
    },
    {
      accessorKey: "modality",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modality" />,
      cell: ({ row }) => <span>{row.original.modality === "team" ? "Team" : "Individual"}</span>,
    },
    {
      accessorKey: "teamName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Team" />,
      cell: ({ row }) => <span>{row.original.teamName ?? "—"}</span>,
    },
    {
      accessorKey: "player",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
      cell: ({ row }) => <span>{row.original.player?.name ?? "—"}</span>,
    },
    {
      accessorKey: "place",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Place" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.place}º</span>,
    },
    {
      accessorKey: "points",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Points" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.points}</span>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
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
        description="Jogos Schoolres TV Sergipe results."
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setConfirmDeleteAll(true)}>
              Delete all
            </Button>
            <Link to="/dashboard/tv-sergipe/create">
              <Button>New result</Button>
            </Link>
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchPlaceholder="Search result..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />

      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all os resultados?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteAllMutation.mutate()}>
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
