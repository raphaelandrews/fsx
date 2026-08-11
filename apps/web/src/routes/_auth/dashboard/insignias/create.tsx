import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/insignias/create")({
  head: () => ({ title: "Create Insignia - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.insignias.create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.insignias.list.queryFilter()); toast.success("Insignia created"); navigate({ to: "/dashboard/insignias" }); },
    onError: (error) => toast.error(error.message ?? "Failed to create insignia"),
  });

  const form = useForm({
    defaultValues: { insignia: "", level: 1 },
    onSubmit: ({ value }) => { createMutation.mutate({ insignia: value.insignia, level: value.level }); },
    validators: { onSubmit: z.object({ insignia: z.string().min(1, "Insignia is required") }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Insignia</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="insignia">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Insignia</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="level">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Level</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : "Create Insignia"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
