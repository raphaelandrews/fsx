import { useForm } from "@tanstack/react-form";
import z from "zod";

import { CIRCUIT_CATEGORIES } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { SearchableSelect } from "@/components/searchable-select";
import { useTRPC } from "@/utils/trpc";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

import type { CircuitPodium } from "../types";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

export type PodiumTarget = { circuitId?: number; circuitPhaseId?: number };

const podiumSchema = z.object({
  playerId: z.string().min(1, "Player is required"),
  category: z.enum(CIRCUIT_CATEGORIES).or(z.literal("")),
  place: z
    .string()
    .refine((v) => v.trim() === "" || Number.isInteger(Number(v)), "Invalid place"),
  points: z.string().refine((v) => v.trim() !== "" && !Number.isNaN(Number(v)), "Invalid points"),
});

export function CircuitPodiumForm({
  target,
  podium,
}: {
  target: PodiumTarget;
  podium?: CircuitPodium;
}) {
  const trpc = useTRPC();

  const createMutation = useAdminMutation(trpc.circuits.podiums.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Podium added",
    failure: "Failed to add podium",
  });

  const updateMutation = useAdminMutation(trpc.circuits.podiums.update.mutationOptions(), {
    invalidates: "circuits",
    success: "Podium updated",
    failure: "Failed to update podium",
    reloadOnConflict: true,
  });

  const deleteMutation = useAdminMutation(trpc.circuits.podiums.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Podium removed",
    failure: "Failed to remove podium",
  });

  const isPending = podium ? updateMutation.isPending : createMutation.isPending;

  const form = useForm({
    defaultValues: {
      playerId: podium ? String(podium.playerId) : "",
      category: (podium?.category ?? "") as (typeof CIRCUIT_CATEGORIES)[number] | "",
      place: podium?.place != null ? String(podium.place) : "",
      points: podium ? String(podium.points) : "",
    },
    validators: { onSubmit: podiumSchema },
    onSubmit: ({ value }) => {
      const payload = {
        playerId: Number(value.playerId),
        circuitId: target.circuitId ?? null,
        circuitPhaseId: target.circuitPhaseId ?? null,
        category: value.category === "" ? null : value.category as (typeof CIRCUIT_CATEGORIES)[number],
        place: value.place.trim() ? Number(value.place) : null,
        points: Number(value.points),
      };
      if (podium) {
        updateMutation.mutate({ id: podium.id, ...payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <form.Field name="playerId">
        {(f) => (
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Player</Label>
            <SearchableSelect
              value={f.state.value}
              onChange={(v) => f.handleChange(v)}
              getQueryOptions={(q) => trpc.players.search.queryOptions({ query: q })}
              placeholder="Search player..."
              emptyText="No player found."
              initialLabel={podium?.player?.name ?? ""}
            />
            <FieldError field={f} error={updateMutation.error} />
          </div>
        )}
      </form.Field>
      <form.Field name="category">
        {(f) => (
          <div className="flex w-28 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Category
            </Label>
            <select
              id={f.name}
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value as (typeof CIRCUIT_CATEGORIES)[number] | "")}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Sem categoria</option>
              {CIRCUIT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <FieldError field={f} error={updateMutation.error} />
          </div>
        )}
      </form.Field>
      <form.Field name="place">
        {(f) => (
          <div className="flex w-20 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Place
            </Label>
            <Input
              id={f.name}
              type="number"
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
            />
            <FieldError field={f} error={updateMutation.error} />
          </div>
        )}
      </form.Field>
      <form.Field name="points">
        {(f) => (
          <div className="flex w-24 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Points
            </Label>
            <Input
              id={f.name}
              type="number"
              step="any"
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
            />
            <FieldError field={f} error={updateMutation.error} />
          </div>
        )}
      </form.Field>
      <div className="flex items-center gap-1">
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" variant="outline" size="sm" disabled={!canSubmit || isPending}>
              {podium ? "Save" : "Add"}
            </Button>
          )}
        </form.Subscribe>
        {podium ? (
          <ConfirmDeleteButton
            itemName="player standing"
            label="Delete podium"
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id: podium.id })}
          />
        ) : null}
      </div>
    </form>
  );
}
