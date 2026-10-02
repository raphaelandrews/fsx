import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Label } from "@fsx/ui/components/label";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { SearchableSelect } from "@/components/searchable-select";
import { AGE_GROUPS, MODALITY_OPTIONS, PLACE_POINTS, SEX_OPTIONS, TEAM_NAMES } from "./-constants";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/tv-sergipe/create")({
  head: () => ({ meta: [{ title: "Create TV Sergipe - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.tvSergipe.create.mutationOptions(), {
    invalidates: ["tvSergipe", "tvSergipe"],
    success: "Result created",
    failure: "Failed to create result",
    onSuccess: () => { navigate({ to: "/dashboard/tv-sergipe" }); },
  });

  const form = useForm({
    defaultValues: {
      clubId: "",
      playerId: "",
      teamName: "A",
      ageGroup: "8",
      sex: "male" as "male" | "female",
      modality: "individual" as "individual" | "team",
      place: 1,
    },
    onSubmit: ({ value }) => {
      createMutation.mutate({
        clubId: Number(value.clubId),
        playerId: value.modality === "individual" ? Number(value.playerId) : null,
        teamName: value.modality === "team" ? (value.teamName as (typeof TEAM_NAMES)[number]) : null,
        ageGroup: value.ageGroup as (typeof AGE_GROUPS)[number],
        sex: value.sex,
        modality: value.modality,
        place: value.place,
      });
    },
    validators: {
      onSubmit: z.object({
        clubId: z.string().min(1, "School is required"),
        playerId: z.string(),
        teamName: z.enum(TEAM_NAMES),
        ageGroup: z.enum(AGE_GROUPS),
        sex: z.enum(["male", "female"]),
        modality: z.enum(["individual", "team"]),
        place: z.number().int().min(1).max(8),
      }),
    },
  });

  const modality = useStore(form.store, (s) => s.values.modality);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create TV Sergipe</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="clubId">
          {(f) => (
            <div className="space-y-2">
              <Label>School</Label>
              <SearchableSelect
                value={f.state.value}
                onChange={(v) => f.handleChange(v)}
                getQueryOptions={(q) => trpc.clubs.search.queryOptions({ query: q })}
                placeholder="Search school..."
                emptyText="No school found."
              />
              <FieldError field={f} error={createMutation.error} />
            </div>
          )}
        </form.Field>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="ageGroup">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Category</Label>
                <select id={f.name} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {AGE_GROUPS.map((g) => <option key={g} value={g}>{g} anos</option>)}
                </select>
              </div>
            )}
          </form.Field>
          <form.Field name="sex">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Sex</Label>
                <select id={f.name} value={f.state.value} onChange={(e) => f.handleChange(e.target.value as "male" | "female")} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {SEX_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
          </form.Field>
        </div>
        <form.Field name="modality">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Modality</Label>
              <select id={f.name} value={f.state.value} onChange={(e) => f.handleChange(e.target.value as "individual" | "team")} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {MODALITY_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}
        </form.Field>
        {modality === "individual" && (
          <form.Field name="playerId">
            {(f) => (
              <div className="space-y-2">
                <Label>Player</Label>
                <SearchableSelect
                  value={f.state.value}
                  onChange={(v) => f.handleChange(v)}
                  getQueryOptions={(q) => trpc.players.search.queryOptions({ query: q })}
                  placeholder="Search player..."
                  emptyText="No player found."
                />
              </div>
            )}
          </form.Field>
        )}
        {modality === "team" && (
          <form.Field name="teamName">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Team (A–J)</Label>
                <select id={f.name} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {TEAM_NAMES.map((n) => <option key={n} value={n}>Team {n}</option>)}
                </select>
                <FieldError field={f} error={createMutation.error} />
              </div>
            )}
          </form.Field>
        )}
        <form.Field name="place">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Place (1–8)</Label>
              <select id={f.name} value={String(f.state.value)} onChange={(e) => f.handleChange(Number(e.target.value))} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>{p}º</option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">Points: {PLACE_POINTS[f.state.value] ?? "—"}</p>
              <FieldError field={f} error={createMutation.error} />
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>{isSubmitting || createMutation.isPending ? "Creating..." : "Create Result"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
