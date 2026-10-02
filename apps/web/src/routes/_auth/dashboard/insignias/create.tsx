import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/insignias/create")({
  head: () => ({ meta: [{ title: "Create Insignia - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.insignias.create.mutationOptions(), {
    invalidates: "insignias",
    success: "Insignia created",
    failure: "Failed to create insignia",
    onSuccess: () => { navigate({ to: "/dashboard/insignias" }); },
  });

  const form = useForm({
    defaultValues: { name: "", level: 1 },
    onSubmit: ({ value }) => { createMutation.mutate({ name: value.name, level: value.level }); },
    validators: { onSubmit: z.object({ name: z.string().min(1, "Insignia is required"), level: z.number() }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Insignia</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Insignia</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="level">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Level</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>{isSubmitting || createMutation.isPending ? "Creating..." : "Create Insignia"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
