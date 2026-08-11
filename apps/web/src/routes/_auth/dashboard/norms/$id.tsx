import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/$id")({
  head: () => ({ title: "Edit Norm - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: norms = [] } = useSuspenseQuery(trpc.norms.list.queryOptions());
  const norm = norms.find((n) => n.id === numId);

  const updateMutation = useMutation({
    ...trpc.norms.update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.norms.list.queryFilter()); toast.success("Norm updated"); },
    onError: () => toast.error("Failed to update norm"),
  });

  if (!norm) return <p>Norm not found.</p>;

  const form = useForm({
    defaultValues: { norm: norm.norm },
    onSubmit: ({ value }) => { updateMutation.mutate({ id: numId, norm: value.norm }); },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Norm</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/norms" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="norm">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Norm</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
