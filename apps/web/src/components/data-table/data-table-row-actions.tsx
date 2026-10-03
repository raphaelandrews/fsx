import { useState, type ReactNode } from "react";
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
  /** Route path pattern for the edit page, e.g. "/dashboard/clubs/$id". */
  editTo?: string;
  /** Edit in place (e.g. a dialog) instead of navigating to `editTo`. */
  onEdit?: () => void;
  /** Delete current row; while `isDeleting`, the confirm stays disabled. Omit for records that cannot be deleted. */
  onDelete?: () => void;
  isDeleting?: boolean;
  displayName?: string;
  /** What the row is, for the confirmation title, e.g. "club". */
  noun?: string;
  /** Extra menu items rendered between Edit and Delete. */
  extraItems?: ReactNode;
  editLabel?: string;
  deleteLabel?: string;
  /** Replaces the default "will be permanently deleted" confirmation text. */
  deleteDescription?: string;
}

export function DataTableRowActions({
  id,
  editTo,
  onEdit,
  onDelete,
  isDeleting = false,
  displayName,
  noun = "item",
  extraItems,
  editLabel = "Edit",
  deleteLabel = "Delete",
  deleteDescription,
}: DataTableRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Open menu"
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted/50"
              size="icon"
              variant="ghost"
            />
          }
        >
          <HugeiconsIcon className="size-4" icon={EllipsisIcon} strokeWidth={2} />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[150px] p-1">
          <DropdownMenuItem
            {...(onEdit ? { onClick: onEdit } : { render: <Link to={editTo as string} params={{ id }} /> })}
          >
            <HugeiconsIcon className="mr-2 size-4" icon={Edit01Icon} strokeWidth={2} />
            {editLabel}
          </DropdownMenuItem>
          {extraItems}
          {onDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Delete03Icon} strokeWidth={2} />
                {deleteLabel}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteLabel} this {noun}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDescription ??
                `${displayName ? `“${displayName}” will be permanently deleted. ` : ""}This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              variant="destructive"
              onClick={() => {
                onDelete?.();
                setShowDeleteDialog(false);
              }}
            >
              {deleteLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
