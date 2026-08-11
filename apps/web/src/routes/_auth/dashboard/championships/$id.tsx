import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

const TITLE = "Championship";
const DOMAIN = "champions" as const;
const PATH = "/_auth/dashboard/championships";

export const Route = createFileRoute(PATH + "/$id")({
  head: () => ({ title: `Edit ${TITLE} - Admin - FSX` }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: items = [] } = useSuspenseQuery(trpc[DOMAIN].list.queryOptions());
  const item = items.find((i: any) => i.id === numId);

  const updateMutation = useMutation({
    ...trpc[DOMAIN].update.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc[DOMAIN].list.queryFilter()); toast.success(`${TITLE} updated`); },
    onError: () => toast.error(`Failed to update ${TITLE.toLowerCase()}`),
  });

  if (!item) return <p>{TITLE} not found.</p>;

  const form = useForm({
    defaultValues: { name: item.name },
    onSubmit: ({ value }) => { updateMutation.mutate({ id: numId, name: value.name }); },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit {TITLE}</h1>
        <Button variant="outline" onClick={() => navigate({ to: PATH })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
