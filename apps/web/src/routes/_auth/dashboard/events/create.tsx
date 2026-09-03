import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { EventLinksEditor, type EventLinkDraft } from "@/components/event-links-editor";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/events/create")({
  head: () => ({ meta: [{ title: "Create Event - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [links, setLinks] = useState<EventLinkDraft[]>([]);

  const createMutation = useMutation(trpc.events.create.mutationOptions());
  const setLinksMutation = useMutation(trpc.events.setLinks.mutationOptions());

  const form = useForm({
    defaultValues: { name: "", startDate: "" },
    onSubmit: async ({ value }) => {
      try {
        const [created] = await createMutation.mutateAsync({
          name: value.name,
          startDate: value.startDate,
        });
        if (links.length > 0) {
          await setLinksMutation.mutateAsync({
            eventId: created.id,
            links: links.map((l, i) => ({ ...l, sortOrder: i + 1 })),
          });
        }
        qc.invalidateQueries(trpc.events.list.queryFilter());
        toast.success("Event created");
        navigate({ to: "/dashboard/events" });
      } catch {
        toast.error("Failed to create event");
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        startDate: z.string().min(1, "Start date is required"),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Event</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="name">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Name</Label>
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
              {f.state.meta.errors.map((e) => (
                <p key={e?.message} className="text-destructive text-xs">
                  {e?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
        <form.Field name="startDate">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Start Date</Label>
              <Input
                id={f.name}
                type="date"
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
              {f.state.meta.errors.map((e) => (
                <p key={e?.message} className="text-destructive text-xs">
                  {e?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
        <EventLinksEditor value={links} onChange={setLinks} />
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
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
