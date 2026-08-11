import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/roles/$id")({
  head: () => ({ title: "Edit Role - Admin - FSX" }),
  loader: ({ context }) => context.trpc.roles.list.ensureQueryData(),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: roles = [] } = useSuspenseQuery(trpc.roles.list.queryOptions());
  const role = roles.find((r) => r.id === numId);

  const updateMutation = useMutation({
    ...trpc.roles.update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.roles.list.queryFilter()); toast.success("Role updated"); },
    onError: () => toast.error("Failed to update role"),
  });

  if (!role) return <p>Role not found.</p>;

  const form = useForm({
    defaultValues: { role: role.role, shortRole: role.shortRole, type: role.type },
    onSubmit: ({ value }) => { updateMutation.mutate({ id: numId, role: value.role, shortRole: value.shortRole, type: value.type }); },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Role</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/roles" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="role">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Role</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="shortRole">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Short Role</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label>Type</Label><select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="management">Management</option><option value="referee">Referee</option><option value="teacher">Teacher</option></select></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
