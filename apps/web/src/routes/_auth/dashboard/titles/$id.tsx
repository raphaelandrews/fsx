import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/titles/$id")({
  head: () => ({ title: "Edit Title - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: titles = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());
  const title = titles.find((t) => t.id === numId);

  const updateMutation = useMutation({
    ...trpc.titles.update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.titles.list.queryFilter()); toast.success("Title updated"); },
    onError: () => toast.error("Failed to update title"),
  });

  if (!title) return <p>Title not found.</p>;

  const form = useForm({
    defaultValues: { title: title.title, shortTitle: title.shortTitle, type: title.type },
    onSubmit: ({ value }) => { updateMutation.mutate({ id: numId, title: value.title, shortTitle: value.shortTitle, type: value.type }); },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Title</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/titles" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="title">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Title</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="shortTitle">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Short Title</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="type">{(f) => (<div className="space-y-2"><Label>Type</Label><select value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="internal">Internal</option><option value="external">External</option></select></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
