import { useState } from "react";

import { Button } from "@fsx/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@fsx/ui/components/alert-dialog";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  pending?: boolean;
  itemName?: string;
  label?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  className?: string;
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
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className={className}
        disabled={pending}
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="destructive"
      >
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {description ?? `${itemName ? `“${itemName}” will be permanently deleted. ` : ""}This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              variant="destructive"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
