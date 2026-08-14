import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/events/$id")({
  head: () => ({ meta: [{ title: "Edit Event - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.events.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: events = [] } = useSuspenseQuery(trpc.events.list.queryOptions());
  const event = events.find((e) => e.id === numId);

  const updateMutation = useMutation({
    ...trpc.events.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.events.list.queryFilter());
      toast.success("Event updated");
    },
    onError: () => toast.error("Failed to update event"),
  });

  if (!event) {
    return <p>Event not found.</p>;
  }

  const form = useForm({
    defaultValues: {
      name: event.name, startDate: event.startDate, endDate: event.endDate ?? "",
      type: event.type, timeControl: event.timeControl,
      regulation: event.regulation ?? "", form: event.form ?? "",
      chessResults: event.chessResults ?? "",
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId, name: value.name, startDate: value.startDate,
        endDate: value.endDate || null, type: value.type, timeControl: value.timeControl,
        regulation: value.regulation || null, form: value.form || null,
        chessResults: value.chessResults || null,
      });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Event</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/events" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="startDate">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Start Date</Label><Input id={f.name} type="date" value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
          <form.Field name="endDate">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>End Date</Label><Input id={f.name} type="date" value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="type">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Type</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
          <form.Field name="timeControl">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Time Control</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        </div>
        <form.Field name="regulation">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Regulation</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="form">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Form</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="chessResults">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Chess Results URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
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
