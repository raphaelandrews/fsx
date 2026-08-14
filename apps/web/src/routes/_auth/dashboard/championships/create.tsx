import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

const TITLE = "Championship";
const DOMAIN = "champions" as const;

export const Route = createFileRoute("/_auth/dashboard/championships/create")({
  head: () => ({ meta: [{ title: `Create ${TITLE} - Admin - FSX` }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc[DOMAIN].create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc[DOMAIN].list.queryFilter()); toast.success(`${TITLE} created`); navigate({ to: "/dashboard/championships" }); },
    onError: (error) => toast.error(error.message ?? `Failed to create ${TITLE.toLowerCase()}`),
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
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : `Create ${TITLE}`}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
