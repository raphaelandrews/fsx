import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@fsx/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@fsx/ui/components/dialog";
import { Input } from "@fsx/ui/components/input";
import { cn } from "@fsx/ui/lib/utils";

import { InlineAlert } from "@/components/admin/inline-alert";
import { SearchableSelect } from "@/components/form/searchable-select";
import { useAdminMutation } from "@/lib/admin-mutations";
import { getAdminErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/lib/trpc";

const CONFIRM_WORD = "merge";

type PlayerSummary = {
  id: number;
  name: string;
  nickname: string | null;
  birthDate: string | null;
  classic: number;
  rapid: number;
  blitz: number;
  cbxId: number | null;
  fideId: number | null;
};

function PlayerCard({ player, outcome }: { player: PlayerSummary; outcome: "kept" | "deleted" }) {
  const kept = outcome === "kept";
  return (
    <div className={cn("rounded-lg border p-3 text-sm", kept ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
      <p className={cn("font-semibold text-xs uppercase tracking-wide", kept ? "text-success" : "text-destructive")}>
        {kept ? "Kept" : "Deleted"} · ID {player.id}
      </p>
      <p className="mt-1 font-semibold">{player.name}</p>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-muted-foreground tabular-nums">
        <dt>Ratings</dt>
        <dd>
          {player.classic} classic · {player.rapid} rapid · {player.blitz} blitz
        </dd>
        {player.birthDate ? (
          <>
            <dt>Born</dt>
            <dd>{player.birthDate}</dd>
          </>
        ) : null}
        {player.cbxId || player.fideId ? (
          <>
            <dt>IDs</dt>
            <dd>{[player.cbxId && `CBX ${player.cbxId}`, player.fideId && `FIDE ${player.fideId}`].filter(Boolean).join(" · ")}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

export function MergePlayerButton({ playerId, playerName }: { playerId: number; playerName: string }) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [targetId, setTargetId] = useState("");
  const [typed, setTyped] = useState("");
  const other = Number(targetId);

  useEffect(() => {
    if (open) return;
    setStep("pick");
    setTargetId("");
    setTyped("");
  }, [open]);

  const reviewing = open && step === "review" && other > 0;
  const current = useQuery({ ...trpc.players.forEdit.queryOptions({ id: playerId }), enabled: reviewing });
  const candidate = useQuery({ ...trpc.players.forEdit.queryOptions({ id: other }), enabled: reviewing });

  const mutation = useAdminMutation(trpc.players.merge.mutationOptions(), {
    invalidates: "players",
    awaitInvalidation: true,
    success: "Players merged",
    failure: "Failed to merge players",
    onSuccess: (result) => {
      setOpen(false);
      return navigate({ to: "/dashboard/players/$id", params: { id: result.id } });
    },
  });

  const players = current.data && candidate.data ? [current.data, candidate.data].sort((a, b) => a.id - b.id) : null;
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Merge with…
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{step === "pick" ? `Merge “${playerName}” with another player` : "Review the merge"}</DialogTitle>
            <DialogDescription>
              {step === "pick"
                ? "Use this when the same person was registered twice. Search for the other record."
                : "Results, podiums, titles and other history move to the kept record, and its ratings are rebuilt from the combined rating history."}
            </DialogDescription>
          </DialogHeader>

          {step === "pick" ? (
            <SearchableSelect
              id="merge-target"
              value={targetId}
              onChange={setTargetId}
              getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
              placeholder="Search the other record..."
              emptyText="No player found."
            />
          ) : (
            <div className="grid gap-4">
              {players ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <PlayerCard player={players[0]!} outcome="kept" />
                  <PlayerCard player={players[1]!} outcome="deleted" />
                </div>
              ) : current.isError || candidate.isError ? (
                <InlineAlert tone="error" title="Could not load the players">
                  {getAdminErrorMessage(current.error ?? candidate.error, "Go back and try again.")}
                </InlineAlert>
              ) : (
                <p className="text-muted-foreground text-sm">Loading both records…</p>
              )}
              <InlineAlert tone="warning" title="This cannot be undone">
                The record with the higher ID is deleted for good, along with its photo. If both players have a result in
                the same tournament, the merge is refused and tells you which.
              </InlineAlert>
              <label className="grid gap-1.5 text-sm">
                <span>
                  Type <strong className="font-semibold">{CONFIRM_WORD}</strong> to confirm
                </span>
                <Input
                  autoComplete="off"
                  autoFocus
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  aria-label={`Type ${CONFIRM_WORD} to confirm`}
                />
              </label>
            </div>
          )}

          <DialogFooter>
            {step === "pick" ? (
              <>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!targetId || other === playerId}
                  onClick={() => setStep("review")}
                >
                  Review
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setStep("pick")}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  loading={mutation.isPending}
                  disabled={!players || !confirmed}
                  onClick={() => mutation.mutate({ sourceId: playerId, targetId: other })}
                >
                  {mutation.isPending ? "Merging…" : "Merge players"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
