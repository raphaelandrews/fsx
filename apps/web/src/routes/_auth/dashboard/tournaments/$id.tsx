import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournaments/$id")({
  head: () => ({ title: "Edit Tournament - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: tournaments = [] } = useSuspenseQuery(trpc.tournaments.list.queryOptions());
  const tournament = tournaments.find((t) => t.id === numId);

  const updateMutation = useMutation({
    ...trpc.tournaments.update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tournaments.list.queryFilter()); toast.success("Tournament updated"); },
    onError: () => toast.error("Failed to update tournament"),
  });

  if (!tournament) return <p>Tournament not found.</p>;

  const form = useForm({
    defaultValues: { name: tournament.name, chessResults: tournament.chessResults ?? "", date: tournament.date ?? "", ratingType: tournament.ratingType, championshipId: tournament.championshipId },
    onSubmit: ({ value }) => { updateMutation.mutate({ id: numId, name: value.name, chessResults: value.chessResults || null, date: value.date || null, ratingType: value.ratingType, championshipId: value.championshipId }); },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Tournament</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/tournaments" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="ratingType">{(f) => (<div className="space-y-2"><Label>Rating Type</Label><select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="blitz">Blitz</option><option value="rapid">Rapid</option><option value="classic">Classic</option></select></div>)}</form.Field>
        <form.Field name="date">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Date (YYYY-MM-DD)</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="chessResults">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Chess Results URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="championshipId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Championship ID</Label><Input id={f.name} type="number" value={f.state.value?.toString() ?? ""} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
