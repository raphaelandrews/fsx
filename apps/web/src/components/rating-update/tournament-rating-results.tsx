import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { AdminSection } from "@/components/admin/form-layout";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { RowLink } from "@/components/data-table/row-link";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

export function TournamentRatingResults({ tournamentId }: { tournamentId: number }) {
  const trpc = useTRPC();
  const { data: results } = useSuspenseQuery(
    trpc.playersTournament.listByTournament.queryOptions({ tournamentId }),
  );

  const revertMutation = useAdminMutation(
    trpc.playersTournament.revertTournament.mutationOptions(),
    {
      invalidates: "playersTournament",
      success: "Rating results reverted",
      failure: "Failed to revert the rating results",
    },
  );

  const columns: ColumnDef<(typeof results)[number]>[] = [
    {
      id: "player",
      header: "Player",
      cell: ({ row }) =>
        row.original.player ? (
          <RowLink to="/dashboard/players/$id" id={row.original.player.id}>
            {row.original.player.name}
          </RowLink>
        ) : (
          "Unknown player"
        ),
    },
    {
      id: "before",
      header: () => <span className="block text-right">Before</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">{row.original.oldRating}</span>
      ),
    },
    {
      id: "variation",
      header: () => <span className="block text-right">Variation</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">
          {row.original.variation > 0 ? "+" : ""}
          {row.original.variation}
        </span>
      ),
    },
  ];

  return (
    <AdminSection
      title={`Rating results (${results.length})`}
      description="Imported from Rating update. To fix one player's variation, open the player and use Rating history."
      actions={
        results.length > 0 ? (
          <ConfirmDeleteButton
            label="Revert all"
            confirmLabel="Revert all results"
            title="Revert every rating result of this tournament?"
            description={`Each of the ${results.length} players gets their variation subtracted from the current rating, later results are rebased, and these results are deleted. Import the corrected file afterwards to apply them again.`}
            pending={revertMutation.isPending}
            onConfirm={() => revertMutation.mutate({ tournamentId })}
          />
        ) : null
      }
    >
      <DataTable
        columns={columns}
        data={results}
        emptyState="No rating results recorded for this tournament."
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </AdminSection>
  );
}
