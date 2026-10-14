import { useEffect, useState } from "react";

import { Button } from "@fsx/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@fsx/ui/components/dialog";
import { Textarea } from "@fsx/ui/components/textarea";

export function RejectRequestDialog({
  playerName,
  pending,
  onReject,
}: {
  playerName: string;
  pending: boolean;
  onReject: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Reject
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this request?</DialogTitle>
            <DialogDescription>
              {playerName}’s record stays as it is. The note is kept for your records and is not sent to anyone.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5 text-sm">
            <span>Reason (optional)</span>
            <Textarea
              rows={3}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="For example: the birth date does not match the registration."
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={pending}
              onClick={() => {
                onReject(note);
                setOpen(false);
              }}
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
