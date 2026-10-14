import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@fsx/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@fsx/ui/components/dialog";

import { SearchableSelect } from "@/components/searchable-select";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

export function MergePlayerButton({ playerId, playerName }: { playerId: number; playerName: string }) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");

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

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Merge with…
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge “{playerName}” with another player</DialogTitle>
            <DialogDescription>
              The two records become one and the player with the lowest ID is kept. Results, podiums, titles and
              other history are combined, and ratings are rebuilt from the combined rating history. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <SearchableSelect
            id="merge-target"
            value={targetId}
            onChange={setTargetId}
            getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
            placeholder="Search the other record..."
            emptyText="No player found."
          />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={mutation.isPending || !targetId || Number(targetId) === playerId}
              onClick={() => mutation.mutate({ sourceId: playerId, targetId: Number(targetId) })}
            >
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
