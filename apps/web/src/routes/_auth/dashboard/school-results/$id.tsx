import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";
import { AGE_GROUPS, MODALITY_OPTIONS, PLACE_POINTS, SEX_OPTIONS } from "./-constants";

export const Route = createFileRoute("/_auth/dashboard/school-results/$id")({
  head: () => ({ meta: [{ title: "Edit School Result - Admin - FSX" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.schoolResults.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.players.list.queryOptions()),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: results = [] } = useSuspenseQuery(trpc.schoolResults.list.queryOptions());
  const { data: clubs = [] } = useSuspenseQuery(trpc.clubs.list.queryOptions());
  const { data: players = [] } = useSuspenseQuery(trpc.players.list.queryOptions());
  const result = results.find((r) => r.id === numId);

  const updateMutation = useMutation({
    ...trpc.schoolResults.update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.schoolResults.list.queryFilter()); toast.success("Result updated"); },
    onError: () => toast.error("Failed to update result"),
  });

  if (!result) return <p>Result not found.</p>;

  const form = useForm({
    defaultValues: {
      clubId: String(result.clubId),
      playerId: result.playerId ? String(result.playerId) : "",
      teamName: result.teamName ?? "",
      ageGroup: result.ageGroup,
      sex: result.sex as "male" | "female",
      modality: result.modality as "individual" | "team",
      place: result.place,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId,
        clubId: Number(value.clubId),
        playerId: value.modality === "individual" ? Number(value.playerId) : null,
        teamName: value.modality === "team" ? value.teamName : null,
        ageGroup: value.ageGroup as (typeof AGE_GROUPS)[number],
        sex: value.sex,
        modality: value.modality,
        place: value.place,
      });
    },
  });

  const modality = useStore(form.store, (s) => s.values.modality);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit School Result</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/school-results" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="clubId">
          {(f) => (
            <div className="space-y-2">
              <Label>Escola</Label>
              <select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select club</option>
                {clubs.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
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
                <select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select player</option>
                  {players.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                </select>
              </div>
            )}
          </form.Field>
        )}
        {modality === "team" && (
          <form.Field name="teamName">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Equipe (A/B/…)</Label>
                <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              </div>
            )}
          </form.Field>
        )}
        <form.Field name="place">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Lugar (1–8)</Label>
              <Input id={f.name} type="number" min={1} max={8} value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />
              <p className="text-muted-foreground text-xs">Pontos: {PLACE_POINTS[f.state.value] ?? "—"}</p>
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}