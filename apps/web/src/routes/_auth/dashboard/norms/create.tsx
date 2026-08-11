import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/create")({
  head: () => ({ title: "Create Norm - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.norms.create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.norms.list.queryFilter()); toast.success("Norm created"); navigate({ to: "/dashboard/norms" }); },
    onError: (error) => toast.error(error.message ?? "Failed to create norm"),
  });

  const form = useForm({
    defaultValues: { norm: "" },
    onSubmit: ({ value }) => { createMutation.mutate({ norm: value.norm }); },
    validators: { onSubmit: z.object({ norm: z.string().min(1, "Norm is required") }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Norm</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="norm">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Norm</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : "Create Norm"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
