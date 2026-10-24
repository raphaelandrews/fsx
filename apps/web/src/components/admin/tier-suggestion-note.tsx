import { useSuspenseQuery } from "@tanstack/react-query";

import { COMPETITION_TIER_LABELS } from "@fsx/api/circuit-types";
import { cn } from "@fsx/ui/lib/utils";

import { useTRPC } from "@/lib/trpc";

/** What the field of a tournament suggests as its tier. Advice only: the form below stays the source of truth. */
export function TierSuggestionNote({ tournamentId }: { tournamentId: number }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.tournaments.suggestedTier.queryOptions({ id: tournamentId }));

  if (data.suggested === null) {
    return <p className="mb-4 text-muted-foreground text-sm">{data.reason}</p>;
  }
  const matches = data.suggested === data.current;
  return (
    <div className="mb-4 flex flex-col gap-0.5 rounded-2xl bg-muted p-4 text-sm" role="note">
      <p className="font-medium text-base">
        Suggested tier: {COMPETITION_TIER_LABELS[data.suggested]}{" "}
        <span className={cn("font-normal", matches ? "text-success" : "text-muted-foreground")}>
          {matches ? "· matches the current tier" : `· currently ${COMPETITION_TIER_LABELS[data.current]}`}
        </span>
      </p>
      <p className="text-muted-foreground">{data.reason} It is a hint from the field and is never applied automatically.</p>
    </div>
  );
}
