import { useBlocker } from "@tanstack/react-router";

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

/** Asks before leaving an edit page with changes that were never saved; also covers closing the tab. `saving` is set once Save is pressed, so the redirect after a successful save is not blocked. */
export function LeaveGuard({ dirty, saving }: { dirty: boolean; saving: { current: boolean } }) {
  const unsaved = () => dirty && !saving.current;
  const blocker = useBlocker({
    shouldBlockFn: unsaved,
    enableBeforeUnload: unsaved,
    disabled: !dirty,
    withResolver: true,
  });

  return (
    <AlertDialog open={blocker.status === "blocked"} onOpenChange={(open) => !open && blocker.reset?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>You changed this form and did not save. If you leave now, those changes are lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
