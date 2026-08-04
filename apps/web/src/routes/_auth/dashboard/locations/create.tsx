import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/locations/create")({
  head: () => ({ title: "Create Location - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useMutation({
    ...trpc.locations.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Location created");
      navigate({ to: "/dashboard/locations" });
    },
    onError: () => toast.error("Failed to create location"),
  });

  const form = useForm({
    defaultValues: { name: "", type: "", flag: "" },
    onSubmit: ({ value }) => {
      createMutation.mutate({ name: value.name, type: value.type, flag: value.flag || null });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.string().min(1, "Type is required"),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Location</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Type</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="flag">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Flag Emoji</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Location"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
