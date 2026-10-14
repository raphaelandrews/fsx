import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { optional } from "@/components/admin/entity-form";
import { EntityCreatePage, entityMessages } from "@/components/admin/entity-pages";
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
    ...entityMessages("location").create,
    onSuccess: async () => {
      await commit();
      await navigate({ to: "/dashboard/locations" });
    },
    onError: (_error, variables) => discard(variables.flagUrl),
  });

  return (
    <EntityCreatePage
      noun="location"
      basePath="/dashboard/locations"
      backLabel="Locations"
      description="Add a city, state, or country."
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
      images={tracking}
    />
  );
}
