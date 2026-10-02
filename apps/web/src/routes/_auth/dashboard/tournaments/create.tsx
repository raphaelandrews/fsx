import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import z from "zod";

import { DatePicker } from "@/components/date-picker";
import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

const RATING_TYPES = ["blitz", "rapid", "classic"] as const;

export const Route = createFileRoute("/_auth/dashboard/tournaments/create")({
  head: () => ({ meta: [{ title: "Create Tournament - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.tournaments.create.mutationOptions(), {
    invalidates: "tournaments",
    success: "Tournament created",
    failure: "Failed to create tournament",
    onSuccess: () => { navigate({ to: "/dashboard/tournaments" }); },
  });

  const form = useForm({
    defaultValues: { name: "", chessResults: "", date: "", ratingType: "rapid" as (typeof RATING_TYPES)[number], championshipId: null as number | null },
    onSubmit: ({ value }) => { createMutation.mutate({ name: value.name, chessResults: value.chessResults || null, date: value.date || null, ratingType: value.ratingType, championshipId: value.championshipId }); },
    validators: { onSubmit: z.object({ name: z.string().min(1, "Name is required"), chessResults: z.string(), date: z.string(), ratingType: z.enum(RATING_TYPES), championshipId: z.number().nullable() }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Tournament</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="ratingType">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Rating Type</Label><select id={f.name} value={f.state.value} onChange={(e) => f.handleChange(e.target.value as (typeof RATING_TYPES)[number])} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="blitz">Blitz</option><option value="rapid">Rapid</option><option value="classic">Classic</option></select></div>)}</form.Field>
        <form.Field name="date">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Date</Label><DatePicker id={f.name} value={f.state.value} onChange={(value) => f.handleChange(value)} placeholder="Select a date" /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="chessResults">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Chess Results URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="championshipId">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Championship ID</Label><Input id={f.name} type="number" value={f.state.value?.toString() ?? ""} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>{isSubmitting || createMutation.isPending ? "Creating..." : "Create Tournament"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
