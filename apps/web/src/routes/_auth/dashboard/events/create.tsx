import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/events/create")({
  head: () => ({ title: "Create Event - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useMutation({
    ...trpc.events.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Event created");
      navigate({ to: "/dashboard/events" });
    },
    onError: () => toast.error("Failed to create event"),
  });

  const form = useForm({
    defaultValues: {
      name: "", startDate: "", endDate: "", type: "", timeControl: "",
      regulation: "", form: "", chessResults: "",
    },
    onSubmit: ({ value }) => {
      createMutation.mutate({
        name: value.name, startDate: value.startDate, endDate: value.endDate || null,
        type: value.type, timeControl: value.timeControl,
        regulation: value.regulation || null, form: value.form || null,
        chessResults: value.chessResults || null,
      });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        startDate: z.string().min(1, "Start date is required"),
        type: z.string().min(1, "Type is required"),
        timeControl: z.string().min(1, "Time control is required"),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Event</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Name</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="startDate">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Start Date</Label><Input id={f.name} type="date" value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
          <form.Field name="endDate">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>End Date</Label><Input id={f.name} type="date" value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="type">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Type</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
          <form.Field name="timeControl">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Time Control</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />{f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}</div>)}</form.Field>
        </div>
        <form.Field name="regulation">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Regulation</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="form">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Form</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="chessResults">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Chess Results URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
