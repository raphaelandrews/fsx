import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/$id")({
  head: () => ({ title: "Edit Podium - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: podiums = [] } = useSuspenseQuery(trpc.tournamentPodiums.list.queryOptions());
  const podium = podiums.find((p) => p.id === numId);

  const updateMutation = useMutation({
    ...trpc.tournamentPodiums.update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tournamentPodiums.list.queryFilter()); toast.success("Podium updated"); },
    onError: () => toast.error("Failed to update podium"),
  });

  if (!podium) return <p>Podium not found.</p>;

  const form = useForm({
    defaultValues: { playerId: podium.playerId, tournamentId: podium.tournamentId, place: podium.place },
    onSubmit: ({ value }) => { updateMutation.mutate({ id: numId, playerId: value.playerId, tournamentId: value.tournamentId, place: value.place }); },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Podium</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/tournament-podiums" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="playerId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Player ID</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /></div>)}</form.Field>
        <form.Field name="tournamentId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Tournament ID</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /></div>)}</form.Field>
        <form.Field name="place">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Place</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
