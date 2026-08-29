import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete03Icon, Edit01Icon, EllipsisIcon } from "@hugeicons/core-free-icons";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@fsx/ui/components/dropdown-menu";

interface DataTableRowActionsProps {
  /** Id of the row, used to build the edit link and send to the delete mutation. */
  id: number;
  /** Route path pattern for the edit link, e.g. "/dashboard/clubs/$id". */
  editTo: string;
  /** Delete current row; while `isDeleting`, the confirm stays disabled. */
  onDelete: () => void;
  isDeleting?: boolean;
  displayName?: string;
}

export function DataTableRowActions({
  id,
  editTo,
  onDelete,
  isDeleting = false,
  displayName,
}: DataTableRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>
          <HugeiconsIcon className="size-4" icon={EllipsisIcon} strokeWidth={2} />
          <span className="sr-only">Abrir menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[150px] p-1">
          <DropdownMenuItem
            render={<Link to={editTo} params={{ id: String(id) }} />}
          >
            <HugeiconsIcon className="mr-2 size-4" icon={Edit01Icon} strokeWidth={2} />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <HugeiconsIcon className="mr-2 size-4" icon={Delete03Icon} strokeWidth={2} />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
              {displayName ? ` Isso excluirá permanentemente "${displayName}".` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              variant="destructive"
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
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
