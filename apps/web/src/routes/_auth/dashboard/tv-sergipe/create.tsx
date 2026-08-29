import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { SearchableSelect } from "@/components/searchable-select";
import { AGE_GROUPS, MODALITY_OPTIONS, PLACE_POINTS, SEX_OPTIONS, TEAM_NAMES } from "./-constants";

export const Route = createFileRoute("/_auth/dashboard/tv-sergipe/create")({
  head: () => ({ meta: [{ title: "Create TV Sergipe - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.tvSergipe.create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tvSergipe.list.queryFilter()); toast.success("Result created"); navigate({ to: "/dashboard/tv-sergipe" }); },
    onError: (error) => toast.error(error.message ?? "Failed to create result"),
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
        clubId: z.string().min(1, "Escola é obrigatória"),
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
              <Label>Escola</Label>
              <SearchableSelect
                value={f.state.value}
                onChange={(v) => f.handleChange(v)}
                getQueryOptions={(q) => trpc.clubs.search.queryOptions({ query: q })}
                placeholder="Buscar escola..."
                emptyText="Nenhuma escola encontrada."
              />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="ageGroup">
            {(f) => (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {AGE_GROUPS.map((g) => <option key={g} value={g}>{g} anos</option>)}
                </select>
              </div>
            )}
          </form.Field>
          <form.Field name="sex">
            {(f) => (
              <div className="space-y-2">
                <Label>Sexo</Label>
                <select value={f.state.value} onChange={(e) => f.handleChange(e.target.value as "male" | "female")} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {SEX_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
          </form.Field>
        </div>
        <form.Field name="modality">
          {(f) => (
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <select value={f.state.value} onChange={(e) => f.handleChange(e.target.value as "individual" | "team")} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {MODALITY_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}
        </form.Field>
        {modality === "individual" && (
          <form.Field name="playerId">
            {(f) => (
              <div className="space-y-2">
                <Label>Jogador</Label>
                <SearchableSelect
                  value={f.state.value}
                  onChange={(v) => f.handleChange(v)}
                  getQueryOptions={(q) => trpc.players.search.queryOptions({ query: q })}
                  placeholder="Buscar jogador..."
                  emptyText="Nenhum jogador encontrado."
                />
              </div>
            )}
          </form.Field>
        )}
        {modality === "team" && (
          <form.Field name="teamName">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Equipe (A–J)</Label>
                <select id={f.name} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {TEAM_NAMES.map((n) => <option key={n} value={n}>Equipe {n}</option>)}
                </select>
              </div>
            )}
          </form.Field>
        )}
        <form.Field name="place">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Lugar (1–8)</Label>
              <select id={f.name} value={String(f.state.value)} onChange={(e) => f.handleChange(Number(e.target.value))} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>{p}º</option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">Pontos: {PLACE_POINTS[f.state.value] ?? "—"}</p>
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : "Create Result"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}