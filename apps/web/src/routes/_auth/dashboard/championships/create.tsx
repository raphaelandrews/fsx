import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

const TITLE = "Championship";
const DOMAIN = "champions" as const;

export const Route = createFileRoute("/_auth/dashboard/championships/create")({
  head: () => ({ meta: [{ title: `Create ${TITLE} - Admin - FSX` }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc[DOMAIN].create.mutationOptions(), {
    invalidates: DOMAIN,
    success: `${TITLE} created`,
    failure: `Failed to create ${TITLE.toLowerCase()}`,
    onSuccess: () => { navigate({ to: "/dashboard/championships" }); },
  });

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: ({ value }) => { createMutation.mutate({ name: value.name }); },
    validators: { onSubmit: z.object({ name: z.string().min(1, "Name is required") }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create {TITLE}</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /><FieldError field={f} error={createMutation.error} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>{isSubmitting || createMutation.isPending ? "Creating..." : `Create ${TITLE}`}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
