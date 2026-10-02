import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
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

type RatingType = "blitz" | "rapid" | "classic";

const RATING_TYPE_LABELS: Record<RatingType, string> = {
  blitz: "Blitz",
  rapid: "Rapid",
  classic: "Classic",
};

interface RatingHistoryEditorProps {
  playerId: number;
  onRatingChange: (ratingType: RatingType, rating: number) => void;
}

export function RatingHistoryEditor({ playerId, onRatingChange }: RatingHistoryEditorProps) {
  const trpc = useTRPC();
  const { data: history } = useSuspenseQuery(trpc.playersTournament.listByPlayer.queryOptions({ playerId }));

  return (
    <section>
      <h2 className="mb-1 font-semibold text-lg">Rating history</h2>
      <p className="mb-3 text-muted-foreground text-sm">
        Correcting or removing a result also updates the current rating and the starting rating of every later
        result of the same type.
      </p>
      {history.length === 0 ? (
        <p className="text-muted-foreground text-sm">No rated tournaments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead>Variation</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((result) => (
                <RatingHistoryRow key={`${result.id}:${result.variation}`} result={result} onRatingChange={onRatingChange} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

interface RatingHistoryRowProps {
  result: {
    id: number;
    oldRating: number;
    variation: number;
    ratingType: string;
    tournament: { name: string; date: string | null } | null;
  };
  onRatingChange: RatingHistoryEditorProps["onRatingChange"];
}

function RatingHistoryRow({ result, onRatingChange }: RatingHistoryRowProps) {
  const trpc = useTRPC();
  const [draft, setDraft] = useState(String(result.variation));
  const variation = Number(draft);
  const valid = draft.trim() !== "" && Number.isInteger(variation) && Math.abs(variation) <= 4000;
  const changed = valid && variation !== result.variation;
  const ratingType = result.ratingType as RatingType;

  const correctMutation = useAdminMutation(trpc.playersTournament.correctVariation.mutationOptions(), {
    invalidates: "playersTournament",
    success: "Variation corrected",
    failure: "Failed to correct the variation",
    reloadOnConflict: true,
    onSuccess: (data) => onRatingChange(data.ratingType, data.rating),
  });
  const removeMutation = useAdminMutation(trpc.playersTournament.remove.mutationOptions(), {
    invalidates: "playersTournament",
    success: "Result removed and rating reverted",
    failure: "Failed to remove the result",
    onSuccess: (data) => onRatingChange(data.ratingType, data.rating),
  });
  const pending = correctMutation.isPending || removeMutation.isPending;
  const tournamentName = result.tournament?.name ?? "Unknown tournament";

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{tournamentName}</div>
        {result.tournament?.date ? (
          <div className="text-muted-foreground text-xs">{result.tournament.date}</div>
        ) : null}
      </TableCell>
      <TableCell>{RATING_TYPE_LABELS[ratingType] ?? result.ratingType}</TableCell>
      <TableCell className="text-right tabular-nums">{result.oldRating}</TableCell>
      <TableCell>
        <Input
          aria-label={`Variation in ${tournamentName}`}
          aria-invalid={!valid}
          className="w-24"
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {result.oldRating + (valid ? variation : result.variation)}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            type="button"
            disabled={!changed || pending}
            onClick={() => correctMutation.mutate({ id: result.id, variation })}
          >
            Save
          </Button>
          <ConfirmDeleteButton
            label="Remove"
            confirmLabel="Remove and revert"
            title="Remove this result?"
            description={`The ${result.variation > 0 ? "+" : ""}${result.variation} from “${tournamentName}” will be subtracted from the current ${RATING_TYPE_LABELS[ratingType] ?? ""} rating, and later results will be rebased.`}
            pending={pending}
            onConfirm={() => removeMutation.mutate({ id: result.id })}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
