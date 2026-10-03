import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { resolveEventLinkType } from "@fsx/api/event-link-types";

import { EventForm } from "@/components/admin/event-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation, useInvalidateAdmin } from "@/lib/admin-mutations";
import { showMutationError } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/events/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit event - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const events = await context.queryClient.ensureQueryData(
      context.trpc.events.list.queryOptions(),
    );
    if (!events.some((event) => event.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();

  const { data: events } = useSuspenseQuery(trpc.events.list.queryOptions());
  const event = events.find((candidate) => candidate.id === id);

  const updateMutation = useMutation(trpc.events.update.mutationOptions());
  const setLinksMutation = useMutation(trpc.events.setLinks.mutationOptions());
  const deleteMutation = useAdminMutation(trpc.events.delete.mutationOptions(), {
    invalidates: "events",
    success: "Event deleted",
    failure: "Failed to delete event",
    onSuccess: () => navigate({ to: "/dashboard/events" }),
  });

  if (!event) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/events"
        backLabel="Events"
        title={event.name}
        description="Edit the event and its links."
        actions={
          <ConfirmDeleteButton
            label="Delete event"
            title="Delete this event?"
            itemName={event.name}
            description={`“${event.name}” and its links will be permanently deleted. This cannot be undone.`}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EventForm
        defaultValues={{
          name: event.name,
          startDate: event.startDate,
          links:
            event.linkGroup?.links.map((link) => ({
              id: link.id,
              type: resolveEventLinkType(link.type, link.label),
              href: link.href ?? "",
              sortOrder: link.sortOrder,
            })) ?? [],
        }}
        error={updateMutation.error}
        submitLabel="Save changes"
        cancelTo="/dashboard/events"
        onSubmit={async ({ name, startDate, links }) => {
          try {
            await updateMutation.mutateAsync({ id, name, startDate });
            await setLinksMutation.mutateAsync({
              eventId: id,
              links: links.map(({ id: linkId, type, href, sortOrder }) => ({
                id: linkId,
                type,
                href,
                sortOrder,
              })),
            });
            void invalidateAdmin("events");
            toast.success("Event updated");
          } catch (error) {
            showMutationError(error, "Failed to update event", () => window.location.reload());
          }
        }}
      />
    </>
  );
}
