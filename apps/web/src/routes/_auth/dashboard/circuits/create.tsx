import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/circuits/create")({
  head: () => ({ meta: [{ title: "Create Circuit - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.circuits.create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.circuits.listSimple.queryFilter()); toast.success("Circuit created"); navigate({ to: "/dashboard/circuits" }); },
    onError: (error) => toast.error(error.message ?? "Failed to create circuit"),
  });

  const form = useForm({
    defaultValues: { name: "", type: "default" },
    onSubmit: ({ value }) => { createMutation.mutate({ name: value.name, type: value.type }); },
    validators: { onSubmit: z.object({ name: z.string().min(1, "Name is required"), type: z.string() }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Circuit</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label>Type</Label><select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="default">Default</option><option value="categories">Categories</option><option value="school">School</option></select></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : "Create Circuit"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
