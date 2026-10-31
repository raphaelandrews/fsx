import { useEffect, useState } from "react";

import { Button } from "@fsx/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@fsx/ui/components/dialog";

import { SearchableSelect } from "@/components/form/searchable-select";
import { useTRPC } from "@/lib/trpc";

export function BulkClubDialog({
  open,
  onOpenChange,
  count,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  pending: boolean;
  /** `null` clears the club. */
  onConfirm: (clubId: number | null) => void;
}) {
  const trpc = useTRPC();
  const [clubId, setClubId] = useState("");
  useEffect(() => {
    if (!open) setClubId("");
  }, [open]);

  const noun = `${count} ${count === 1 ? "player" : "players"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Set the club of {noun}</DialogTitle>
          <DialogDescription>Replaces their current club. Search for the club, or clear it to leave them without one.</DialogDescription>
        </DialogHeader>
        <div className="min-h-72">
        <SearchableSelect
          id="bulk-club"
          value={clubId}
          onChange={setClubId}
          getQueryOptions={(query) => trpc.clubs.search.queryOptions({ query })}
          placeholder="Search the club..."
          emptyText="No club found."
        />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onConfirm(null)}>
            Clear club
          </Button>
          <Button type="button" loading={pending} disabled={!clubId} onClick={() => onConfirm(Number(clubId))}>
            Set club
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
