import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

export function TournamentRatingResults({ tournamentId }: { tournamentId: number }) {
  const trpc = useTRPC();
  const { data: results } = useSuspenseQuery(trpc.playersTournament.listByTournament.queryOptions({ tournamentId }));

  const revertMutation = useAdminMutation(trpc.playersTournament.revertTournament.mutationOptions(), {
    invalidates: "playersTournament",
    success: "Rating results reverted",
    failure: "Failed to revert the rating results",
  });

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-lg">Rating results ({results.length})</h2>
        {results.length > 0 ? (
          <ConfirmDeleteButton
            label="Revert all"
            confirmLabel="Revert all results"
            title="Revert every rating result of this tournament?"
            description={`Each of the ${results.length} players gets their variation subtracted from the current rating, later results are rebased, and these results are deleted. Import the corrected file afterwards to apply them again.`}
            pending={revertMutation.isPending}
            onConfirm={() => revertMutation.mutate({ tournamentId })}
          />
        ) : null}
      </div>
      {results.length === 0 ? (
        <p className="text-muted-foreground text-sm">No rating results recorded for this tournament.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">Variation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    {result.player ? (
                      <Link to="/dashboard/players/$id" params={{ id: result.player.id }} className="underline-offset-4 hover:underline">
                        {result.player.name}
                      </Link>
                    ) : (
                      "Unknown player"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{result.oldRating}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {result.variation > 0 ? "+" : ""}
                    {result.variation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="mt-2 text-muted-foreground text-xs">
        To fix one player's variation, open the player and edit it under Rating history.
      </p>
    </section>
  );
}
