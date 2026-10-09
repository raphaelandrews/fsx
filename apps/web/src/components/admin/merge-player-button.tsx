import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { showMutationError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export function MergePlayerButton({ playerId, playerName }: { playerId: number; playerName: string }) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");

  const mutation = useMutation({
    ...trpc.players.merge.mutationOptions(),
    onSuccess: async (result) => {
      await invalidateAdmin("players");
      toast.success("Players merged");
      setOpen(false);
      navigate({ to: "/dashboard/players/$id", params: { id: result.id } });
    },
    onError: (error) => showMutationError(error, "Failed to merge players"),
  });

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Merge into…
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge “{playerName}” into another player</DialogTitle>
            <DialogDescription>
              Results, podiums, titles, roles and other history of this player move to the player you pick, and
              this record is deleted. The lower rating of each type is kept. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <SearchableSelect
            id="merge-target"
            value={targetId}
            onChange={setTargetId}
            getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
            placeholder="Search the player to keep..."
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
