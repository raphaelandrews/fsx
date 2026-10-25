import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/lib/trpc";
import { EntityFormDialog } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { RowLink } from "@/components/data-table/row-link";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useAdminMutation } from "@/lib/admin-mutations";
import { EmptyCollection } from "@/components/admin/empty-collection";
import { TvSergipeCreateDialog } from "@/components/admin/create-dialogs";
import { TvSergipeBulkDialog } from "@/components/admin/tv-sergipe-bulk";

export const Route = createFileRoute("/_auth/dashboard/tv-sergipe/")({
  head: () => ({ meta: [{ title: "TV Sergipe - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tvSergipe.listAdmin.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const [creating, setCreating] = useState(false);
  const trpc = useTRPC();
  const [assigning, setAssigning] = useState(false);
  const [bulk, setBulk] = useState(false);

  const { data = [] } = useSuspenseQuery(trpc.tvSergipe.listAdmin.queryOptions());

  const deleteMutation = useAdminMutation(trpc.tvSergipe.delete.mutationOptions(), {
    invalidates: "tvSergipe",
    success: "Result deleted",
    failure: "Failed to delete result",
  });

  const assignMutation = useAdminMutation(trpc.tvSergipe.assignEdition.mutationOptions(), {
    invalidates: "tvSergipe",
    success: "Results assigned",
    failure: "Failed to assign results",
    onSuccess: () => setAssigning(false),
  });
  const unassigned = data.filter((result) => result.tournamentId === null).length;

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      id: "tournament",
      header: "Edition",
      cell: ({ row }) => <span>{row.original.tournament?.name ?? "—"}</span>,
    },
    {
      accessorKey: "club",
      header: ({ column }) => <DataTableColumnHeader column={column} title="School" />,
      cell: ({ row }) => <RowLink to="/dashboard/tv-sergipe/$id" id={row.original.id}>{row.original.club?.name ?? "—"}</RowLink>,
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
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/tv-sergipe/$id"
          noun="result"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="TV Sergipe"
        description="TV Sergipe School Games results by school, category, and modality."
        actions={
          <div className="flex gap-2">
            {unassigned > 0 ? (
              <Button variant="outline" onClick={() => setAssigning(true)}>
                Assign {unassigned} to an edition
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setBulk(true)}>Add several</Button>
            <Button onClick={() => setCreating(true)}>New result</Button>
          </div>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="TV Sergipe results" onCreate={() => setCreating(true)} />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchPlaceholder="Search result..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />

      <EntityFormDialog
        open={assigning}
        onOpenChange={setAssigning}
        title="Assign results to an edition"
        fields={[
          {
            name: "tournamentId",
            label: "Tournament",
            kind: "search",
            required: true,
            placeholder: "Search tournament...",
            emptyText: "No tournament found.",
            hint: `Applies to the ${unassigned} result${unassigned === 1 ? "" : "s"} saved before editions existed.`,
            getQueryOptions: (query) => trpc.tournaments.search.queryOptions({ query }),
          },
        ]}
        defaultValues={{ tournamentId: "" }}
        onSubmit={(values) => assignMutation.mutate({ tournamentId: Number(values.tournamentId) })}
        error={assignMutation.error}
        pending={assignMutation.isPending}
        submitLabel="Assign results"
      />
      <TvSergipeCreateDialog open={creating} onOpenChange={setCreating} />
      <TvSergipeBulkDialog open={bulk} onOpenChange={setBulk} />
    </div>
  );
}
