import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { Textarea } from "@fsx/ui/components/textarea";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/announcements/$id")({
  head: () => ({ title: "Edit Announcement - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: announcements = [] } = useSuspenseQuery(trpc.announcements.list.queryOptions());
  const announcement = announcements.find((a) => a.id === numId);

  const updateMutation = useMutation({
    ...trpc.announcements.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.announcements.list.queryFilter());
      toast.success("Announcement updated");
    },
    onError: () => toast.error("Failed to update announcement"),
  });

  if (!announcement) {
    return <p>Announcement not found.</p>;
  }

  const form = useForm({
    defaultValues: {
      year: announcement.year,
      number: announcement.number,
      content: announcement.content,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ id: numId, year: value.year, number: value.number, content: value.content });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Announcement</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/announcements" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="year">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Year</Label>
              <Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />
            </div>
          )}
        </form.Field>
        <form.Field name="number">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Number</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </form.Field>
        <form.Field name="content">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Content</Label>
              <Textarea id={f.name} rows={4} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </form.Field>
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
