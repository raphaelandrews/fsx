import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/create")({
  head: () => ({ title: "Create Podium - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.tournamentPodiums.create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tournamentPodiums.list.queryFilter()); toast.success("Podium created"); navigate({ to: "/dashboard/tournament-podiums" }); },
    onError: (error) => toast.error(error.message ?? "Failed to create podium"),
  });

  const form = useForm({
    defaultValues: { playerId: 0, tournamentId: 0, place: 1 },
    onSubmit: ({ value }) => { createMutation.mutate({ playerId: value.playerId, tournamentId: value.tournamentId, place: value.place }); },
    validators: { onSubmit: z.object({ playerId: z.number().min(1, "Player is required"), tournamentId: z.number().min(1, "Tournament is required"), place: z.number().min(1) }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Podium</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="playerId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Player ID</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="tournamentId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Tournament ID</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="place">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Place</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : "Create Podium"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
