import { useState, type ReactNode } from "react";

import { Button } from "@fsx/ui/components/button";

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
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className={className}
        loading={pending}
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="destructive"
      >
        {label}
      </Button>
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
