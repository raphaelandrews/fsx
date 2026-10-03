import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { EventForm } from "@/components/admin/event-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { showMutationError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/events/create")({
  head: () => ({ meta: [{ title: "New event - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();
  const createMutation = useMutation(trpc.events.create.mutationOptions());
  const setLinksMutation = useMutation(trpc.events.setLinks.mutationOptions());

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/events"
        backLabel="Events"
        title="New event"
        description="Add an upcoming event and its links."
      />
      <EventForm
        defaultValues={{ name: "", startDate: "", links: [] }}
        error={createMutation.error}
        submitLabel="Create event"
        cancelTo="/dashboard/events"
        onSubmit={async ({ name, startDate, links }) => {
          try {
            const [created] = await createMutation.mutateAsync({ name, startDate });
            if (created && links.length > 0)
              await setLinksMutation.mutateAsync({ eventId: created.id, links });
            void invalidateAdmin("events");
            toast.success("Event created");
            await navigate({ to: "/dashboard/events" });
          } catch (error) {
            showMutationError(error, "Failed to create event");
          }
        }}
      />
    </>
  );
}
