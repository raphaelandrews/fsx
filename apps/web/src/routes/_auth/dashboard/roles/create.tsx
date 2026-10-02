import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

const ROLE_TYPES = ["management", "referee", "teacher"] as const;

export const Route = createFileRoute("/_auth/dashboard/roles/create")({
  head: () => ({ meta: [{ title: "Create Role - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.roles.create.mutationOptions(), {
    invalidates: "roles",
    success: "Role created",
    failure: "Failed to create role",
    onSuccess: () => { navigate({ to: "/dashboard/roles" }); },
  });

  const form = useForm({
    defaultValues: { name: "", shortName: "", type: "management" as (typeof ROLE_TYPES)[number] },
    onSubmit: ({ value }) => { createMutation.mutate({ name: value.name, shortName: value.shortName, type: value.type }); },
    validators: { onSubmit: z.object({ name: z.string().min(1, "Role is required"), shortName: z.string(), type: z.enum(ROLE_TYPES) }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Role</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Role</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="shortName">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Short Role</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Type</Label><select id={f.name} value={f.state.value} onChange={(e) => f.handleChange(e.target.value as (typeof ROLE_TYPES)[number])} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="management">Management</option><option value="referee">Referee</option><option value="teacher">Teacher</option></select></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>{isSubmitting || createMutation.isPending ? "Creating..." : "Create Role"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
