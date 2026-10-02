import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { DatePicker } from "@/components/date-picker";
import { EventLinksEditor, type EventLinkDraft } from "@/components/event-links-editor";
import { useTRPC } from "@/utils/trpc";
import { resolveEventLinkType } from "@fsx/api/event-link-types";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/events/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit Event - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.events.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: numId } = Route.useParams();
  const trpc = useTRPC();
  const invalidateAdmin = useInvalidateAdmin();
  const navigate = useNavigate();

  const { data: events = [] } = useSuspenseQuery(trpc.events.list.queryOptions());
  const event = events.find((e) => e.id === numId);

  const updateMutation = useMutation(trpc.events.update.mutationOptions());
  const setLinksMutation = useMutation(trpc.events.setLinks.mutationOptions());

  const [links, setLinks] = useState<EventLinkDraft[]>(
    () =>
      event?.linkGroup?.links.map((l) => ({
        id: l.id,
        type: resolveEventLinkType(l.type, l.label),
        href: l.href ?? "",
        sortOrder: l.sortOrder,
      })) ?? [],
  );

  if (!event) {
    return <p>Event not found.</p>;
  }

  const form = useForm({
    defaultValues: { name: event.name, startDate: event.startDate },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        startDate: z.string().min(1, "Start date is required"),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync({
          id: numId,
          name: value.name,
          startDate: value.startDate,
        });
        await setLinksMutation.mutateAsync({
          eventId: numId,
          links: links.map((l) => ({
            id: l.id,
            type: l.type,
            href: l.href,
            sortOrder: l.sortOrder,
          })),
        });
        void invalidateAdmin("events");
        toast.success("Event updated");
      } catch {
        toast.error("Failed to update event");
      }
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Event</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/events" })}>
          Back
        </Button>
      </div>
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
              <FieldError field={f} error={updateMutation.error} />
            </div>
          )}
        </form.Field>
        <form.Field name="startDate">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Start Date</Label>
              <DatePicker
                id={f.name}
                value={f.state.value}
                onChange={(value) => f.handleChange(value)}
                placeholder="Select a date"
              />
              <FieldError field={f} error={updateMutation.error} />
            </div>
          )}
        </form.Field>
        <EventLinksEditor value={links} onChange={setLinks} />
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
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
