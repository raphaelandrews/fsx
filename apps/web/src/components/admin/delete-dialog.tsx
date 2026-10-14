import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import type { DeleteEntity } from "@fsx/api/services/delete-impact";
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
import { Input } from "@fsx/ui/components/input";

import { InlineAlert } from "@/components/admin/inline-alert";
import { getAdminErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/lib/trpc";

export type DeleteTarget = { entity: DeleteEntity; id: number };

const IMPACT_NOUNS: Record<string, DeleteEntity> = {
  club: "club",
  location: "location",
  championship: "championship",
  title: "title",
  role: "role",
  norm: "norm",
  insignia: "insignia",
  tournament: "tournament",
  circuit: "circuit",
  event: "event",
};

/** The impact lookup for a list or edit page's noun, when the API knows how to count what it affects. */
export function impactTarget(noun: string, id: number): DeleteTarget | undefined {
  const entity = IMPACT_NOUNS[noun];
  return entity ? { entity, id } : undefined;
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Plain description; replaced by the live impact summary when `target` is given and loaded. */
  description?: ReactNode;
  /** Ask the API what this delete would block or take with it. */
  target?: DeleteTarget;
  /** The word the admin has to type before the button enables (bulk or cascading deletes). */
  confirmText?: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
}

const quantity = (item: { count: number; singular: string; plural: string }) =>
  `${item.count} ${item.count === 1 ? item.singular : item.plural}`;

/**
 * One confirmation for every destructive action. Blocking references are shown
 * before the click and disable it; deletes that take other records with them
 * also need the record's name typed, so a stray double click cannot do it.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  target,
  confirmText,
  confirmLabel = "Delete",
  pending = false,
  onConfirm,
}: DeleteDialogProps) {
  const trpc = useTRPC();
  const impactQuery = useQuery({
    ...trpc.deletion.impact.queryOptions(target ?? { entity: "club", id: 1 }),
    enabled: open && target !== undefined,
    staleTime: 0,
    gcTime: 0,
  });
  const impact = impactQuery.data;
  const blocked = (impact?.blockedBy.length ?? 0) > 0;
  const cascades = (impact?.alsoDeletes.length ?? 0) > 0;
  const phrase = confirmText ?? (cascades ? impact?.name : undefined);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const typedOk = !phrase || typed.trim().toLowerCase() === phrase.trim().toLowerCase();
  const checking = target !== undefined && impactQuery.isPending;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription render={<div />}>{description ?? "This cannot be undone."}</AlertDialogDescription>
        </AlertDialogHeader>

        {checking ? <p className="text-muted-foreground text-sm">Checking what this affects…</p> : null}
        {impactQuery.isError ? (
          <InlineAlert tone="warning" title="Could not check what this affects">
            {getAdminErrorMessage(impactQuery.error, "Try again before deleting.")}
          </InlineAlert>
        ) : null}
        {blocked && impact ? (
          <InlineAlert tone="error" title="It cannot be deleted yet">
            “{impact.name}” is still used by {impact.blockedBy.map(quantity).join(", ")}.{" "}
            {[...new Set(impact.blockedBy.flatMap((item) => (item.fix ? [item.fix] : [])))].join(" ")}
          </InlineAlert>
        ) : null}
        {cascades && impact && !blocked ? (
          <InlineAlert tone="warning" title="This also deletes other records">
            {impact.alsoDeletes.map(quantity).join(", ")} will be permanently removed with “{impact.name}”.
          </InlineAlert>
        ) : null}

        {phrase && !blocked ? (
          <label className="grid gap-1.5 text-sm">
            <span>
              Type <strong className="font-semibold">{phrase}</strong> to confirm
            </span>
            <Input
              autoComplete="off"
              autoFocus
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              aria-label={`Type ${phrase} to confirm`}
            />
          </label>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending || checking || blocked || !typedOk}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
