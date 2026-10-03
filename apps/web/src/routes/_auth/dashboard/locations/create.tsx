import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm, optional } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { LOCATION_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/locations/create")({
  head: () => ({ meta: [{ title: "New location - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { tracking, commit, discard } = usePendingImageDeletes();

  const createMutation = useAdminMutation(trpc.locations.create.mutationOptions(), {
    invalidates: "locations",
    success: "Location created",
    failure: "Failed to create location",
    onSuccess: async () => {
      await commit();
      await navigate({ to: "/dashboard/locations" });
    },
    onError: (_error, variables) => discard(variables.flagUrl),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/locations"
        backLabel="Locations"
        title="New location"
        description="Add a city, state, or country."
      />
      <EntityForm
        sections={LOCATION_SECTIONS}
        defaultValues={{ name: "", type: "city", flagUrl: "" }}
        onSubmit={(values) =>
          createMutation.mutate({
            name: values.name!,
            type: values.type as "city" | "state" | "country",
            flagUrl: optional(values.flagUrl!),
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create location"
        cancelTo="/dashboard/locations"
        images={tracking}
      />
    </>
  );
}
