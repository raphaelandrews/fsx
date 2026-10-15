import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@fsx/ui/components/dialog";

import { FormDialogContext } from "@/components/admin/form-layout";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormDialog({ open, onOpenChange, title, description, children }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-170">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {open ? (
          <FormDialogContext.Provider value={() => onOpenChange(false)}>{children}</FormDialogContext.Provider>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
