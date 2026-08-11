import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/titles/create")({
  head: () => ({ title: "Create Title - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.titles.create.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.titles.list.queryFilter()); toast.success("Title created"); navigate({ to: "/dashboard/titles" }); },
    onError: (error) => toast.error(error.message ?? "Failed to create title"),
  });

  const form = useForm({
    defaultValues: { title: "", shortTitle: "", type: "internal" },
    onSubmit: ({ value }) => { createMutation.mutate({ title: value.title, shortTitle: value.shortTitle, type: value.type }); },
    validators: { onSubmit: z.object({ title: z.string().min(1, "Title is required"), type: z.enum(["internal", "external"]) }) },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Title</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="title">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Title</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="shortTitle">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Short Title</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label>Type</Label><select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="internal">Internal</option><option value="external">External</option></select></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Creating..." : "Create Title"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
