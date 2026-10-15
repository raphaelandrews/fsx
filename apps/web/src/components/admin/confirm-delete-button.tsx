import { useState, type ReactNode } from "react";

import { Button } from "@fsx/ui/components/button";

import { DANGER_SLOT_ID, InSlot } from "@/components/admin/admin-slots";
import { DeleteDialog, type DeleteTarget } from "@/components/admin/delete-dialog";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  pending?: boolean;
  itemName?: string;
  label?: string;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  className?: string;
  /** Ask the API what the delete blocks or takes with it. */
  target?: DeleteTarget;
  /** A phrase to type before the confirm button enables. */
  confirmText?: string;
  inline?: boolean;
}

export function ConfirmDeleteButton({
  onConfirm,
  pending = false,
  itemName,
  label = "Delete",
  title = "Delete this item?",
  description,
  confirmLabel = "Delete",
  className,
  target,
  confirmText,
  inline = false,
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  const button = (
    <Button className={className} loading={pending} onClick={() => setOpen(true)} size="lg" type="button" variant="destructive">
      {label}
    </Button>
  );

  return (
    <>
      {inline ? (
        button
      ) : (
        <InSlot id={DANGER_SLOT_ID} fallback={button}>
          {button}
        </InSlot>
      )}
      <DeleteDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={
          description ?? `${itemName ? `“${itemName}” will be permanently deleted. ` : ""}This cannot be undone.`
        }
        target={target}
        confirmText={confirmText}
        confirmLabel={confirmLabel}
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
