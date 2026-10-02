import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { useInvalidateAdmin } from "@/lib/admin-mutations";

const LOCATION_TYPES = ["city", "state", "country"] as const;

export const Route = createFileRoute("/_auth/dashboard/locations/create")({
  head: () => ({ meta: [{ title: "Create Location - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();

  const createMutation = useMutation({
    ...trpc.locations.create.mutationOptions(),
    onSuccess: () => {
      void invalidateAdmin("locations");
      toast.success("Location created");
      navigate({ to: "/dashboard/locations" });
    },
    onError: () => toast.error("Failed to create location"),
  });

  const form = useForm({
    defaultValues: { name: "", type: "city" as (typeof LOCATION_TYPES)[number], flagUrl: "" },
    onSubmit: ({ value }) => {
      createMutation.mutate({ name: value.name, type: value.type, flagUrl: value.flagUrl || null });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(LOCATION_TYPES),
        flagUrl: z.string(),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Location</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Type</Label><select id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value as (typeof LOCATION_TYPES)[number])} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{LOCATION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <form.Field name="flagUrl">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Flag URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>
              {isSubmitting ? "Creating..." : "Create Location"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
