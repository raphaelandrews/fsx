import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/locations/$id")({
  head: () => ({ title: "Edit Location - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: locations = [] } = useSuspenseQuery(trpc.locations.list.queryOptions());
  const location = locations.find((l) => l.id === numId);

  const updateMutation = useMutation({
    ...trpc.locations.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.locations.list.queryFilter());
      toast.success("Location updated");
    },
    onError: () => toast.error("Failed to update location"),
  });

  if (!location) {
    return <p>Location not found.</p>;
  }

  const form = useForm({
    defaultValues: { name: location.name, type: location.type, flag: location.flag ?? "" },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ id: numId, name: value.name, type: value.type, flag: value.flag || null });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Location</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/locations" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Type</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="flag">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Flag Emoji</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
