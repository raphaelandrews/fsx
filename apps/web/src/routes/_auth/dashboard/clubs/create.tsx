import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/clubs/create")({
  head: () => ({ meta: [{ title: "Create Club - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.clubs.create.mutationOptions(), {
    invalidates: "clubs",
    success: "Club created",
    failure: "Failed to create club",
    onSuccess: () => { navigate({ to: "/dashboard/clubs" }); },
  });

  const form = useForm({
    defaultValues: { name: "", logoUrl: "" },
    onSubmit: ({ value }) => {
      createMutation.mutate({ name: value.name, logoUrl: value.logoUrl || null });
    },
    validators: {
      onSubmit: z.object({ name: z.string().min(1, "Name is required"), logoUrl: z.string() }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Club</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="logoUrl">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Logo URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>
              {isSubmitting ? "Creating..." : "Create Club"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
