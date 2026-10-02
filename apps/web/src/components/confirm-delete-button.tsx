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
  className?: string;
}

export function ConfirmDeleteButton({
  onConfirm,
  pending = false,
  itemName,
  label = "Excluir",
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
            <AlertDialogTitle>Excluir este item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
              {itemName ? ` O item “${itemName}” será removido permanentemente.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              variant="destructive"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
