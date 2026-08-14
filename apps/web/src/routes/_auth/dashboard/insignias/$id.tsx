import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/insignias/$id")({
  head: () => ({ meta: [{ title: "Edit Insignia - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.insignias.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: insignias = [] } = useSuspenseQuery(trpc.insignias.list.queryOptions());
  const insignia = insignias.find((i) => i.id === numId);

  const updateMutation = useMutation({
    ...trpc.insignias.update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.insignias.list.queryFilter()); toast.success("Insignia updated"); },
    onError: () => toast.error("Failed to update insignia"),
  });

  if (!insignia) return <p>Insignia not found.</p>;

  const form = useForm({
    defaultValues: { name: insignia.name, level: insignia.level },
    onSubmit: ({ value }) => { updateMutation.mutate({ id: numId, name: value.name, level: value.level }); },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Insignia</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/insignias" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Insignia</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="level">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Level</Label><Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
