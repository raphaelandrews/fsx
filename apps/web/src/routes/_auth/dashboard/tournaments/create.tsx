import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournaments/create")({
  head: () => ({ title: "Create Tournament - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.tournaments.create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tournaments.list.queryFilter()); toast.success("Tournament created"); navigate({ to: "/dashboard/tournaments" }); },
    onError: (error) => toast.error(error.message ?? "Failed to create tournament"),
  });

  const form = useForm({
    defaultValues: { name: "", chessResults: "", date: "", ratingType: "rapid", championshipId: null as number | null },
    onSubmit: ({ value }) => { createMutation.mutate({ name: value.name, chessResults: value.chessResults || null, date: value.date || null, ratingType: value.ratingType, championshipId: value.championshipId }); },
    validators: { onSubmit: z.object({ name: z.string().min(1, "Name is required"), ratingType: z.enum(["blitz", "rapid", "classic"]) }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Tournament</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="ratingType">{(f) => (<div className="space-y-2"><Label>Rating Type</Label><select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="blitz">Blitz</option><option value="rapid">Rapid</option><option value="classic">Classic</option></select></div>)}</form.Field>
        <form.Field name="date">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Date (YYYY-MM-DD)</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="chessResults">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Chess Results URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="championshipId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Championship ID</Label><Input id={f.name} type="number" value={f.state.value?.toString() ?? ""} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : "Create Tournament"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
