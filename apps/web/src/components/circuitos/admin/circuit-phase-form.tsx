import { useForm } from "@tanstack/react-form";
import z from "zod";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { SearchableSelect } from "@/components/searchable-select";
import { useTRPC } from "@/utils/trpc";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

import type { CircuitPhase } from "../types";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

const phaseSchema = z.object({
  tournamentId: z.string().min(1, "Tournament is required"),
  clubId: z.string(),
  sortOrder: z.number().int(),
});

export function CircuitPhaseForm({
  circuitId,
  phase,
  nextSortOrder = 0,
}: {
  circuitId: number;
  phase?: CircuitPhase;
  nextSortOrder?: number;
}) {
  const trpc = useTRPC();

  const createMutation = useAdminMutation(trpc.circuits.phases.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Phase added",
    failure: "Failed to add phase",
  });

  const updateMutation = useAdminMutation(trpc.circuits.phases.update.mutationOptions(), {
    invalidates: "circuits",
    success: "Phase updated",
    failure: "Failed to update phase",
    reloadOnConflict: true,
  });

  const deleteMutation = useAdminMutation(trpc.circuits.phases.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Phase removed",
    failure: "Failed to remove phase",
  });

  const isPending = phase ? updateMutation.isPending : createMutation.isPending;

  const form = useForm({
    defaultValues: {
      tournamentId: phase ? String(phase.tournamentId) : "",
      clubId: phase?.clubId ? String(phase.clubId) : "",
      sortOrder: phase ? phase.sortOrder : nextSortOrder,
    },
    validators: { onSubmit: phaseSchema },
    onSubmit: ({ value }) => {
      const payload = {
        tournamentId: Number(value.tournamentId),
        clubId: value.clubId ? Number(value.clubId) : null,
        sortOrder: value.sortOrder,
      };
      if (phase) {
        updateMutation.mutate({ id: phase.id, ...payload });
      } else {
        createMutation.mutate({ circuitId, ...payload });
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-3"
    >
      <form.Field name="tournamentId">
        {(f) => (
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Tournament</Label>
            <SearchableSelect
              value={f.state.value}
              onChange={(v) => f.handleChange(v)}
              getQueryOptions={(q) => trpc.tournaments.search.queryOptions({ query: q })}
              placeholder="Search tournament..."
              emptyText="No tournament found."
              initialLabel={phase?.tournament?.name ?? ""}
            />
            <FieldError field={f} error={updateMutation.error} />
          </div>
        )}
      </form.Field>
      <form.Field name="clubId">
        {(f) => (
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Host club (optional)</Label>
            <SearchableSelect
              value={f.state.value}
              onChange={(v) => f.handleChange(v)}
              getQueryOptions={(q) => trpc.clubs.search.queryOptions({ query: q })}
              placeholder="Search club..."
              emptyText="No club found."
              initialLabel={phase?.club?.name ?? ""}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="sortOrder">
        {(f) => (
          <div className="flex w-20 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Order
            </Label>
            <Input
              id={f.name}
              type="number"
              value={String(f.state.value)}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(Number(e.target.value))}
            />
            <FieldError field={f} error={updateMutation.error} />
          </div>
        )}
      </form.Field>
      <div className="flex items-center gap-1">
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" variant="outline" size="sm" disabled={!canSubmit || isPending}>
              {phase ? "Save" : "Add phase"}
            </Button>
          )}
        </form.Subscribe>
        {phase ? (
          <ConfirmDeleteButton
            itemName={phase.tournament.name}
            label="Delete phase"
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id: phase.id })}
          />
        ) : null}
      </div>
    </form>
  );
}
