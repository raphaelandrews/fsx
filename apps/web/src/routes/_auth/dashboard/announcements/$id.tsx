import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { Textarea } from "@fsx/ui/components/textarea";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";
import { orNotFound } from "@/lib/errors";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/announcements/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit Announcement - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(context.queryClient.ensureQueryData(context.trpc.announcements.byId.queryOptions({ id: params.id }))),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: numId } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: announcement } = useSuspenseQuery(trpc.announcements.byId.queryOptions({ id: numId }));

  const updateMutation = useAdminMutation(trpc.announcements.update.mutationOptions(), {
    invalidates: "announcements",
    success: "Announcement updated",
    failure: "Failed to update announcement",
    reloadOnConflict: true,
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
              <FieldError field={f} error={updateMutation.error} />
            </div>
          )}
        </form.Field>
        <form.Field name="number">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Number</Label>
              <Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />
              <FieldError field={f} error={updateMutation.error} />
            </div>
          )}
        </form.Field>
        <form.Field name="content">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Content</Label>
              <Textarea id={f.name} rows={4} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              <FieldError field={f} error={updateMutation.error} />
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || updateMutation.isPending}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
