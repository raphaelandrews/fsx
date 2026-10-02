import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/create")({
  head: () => ({ meta: [{ title: "Create Podium - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.tournamentPodiums.create.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium created",
    failure: "Failed to create podium",
    onSuccess: () => { navigate({ to: "/dashboard/tournament-podiums" }); },
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
        <form.Field name="playerId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Player ID</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="tournamentId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Tournament ID</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="place">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Place</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>{isSubmitting || createMutation.isPending ? "Creating..." : "Create Podium"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
