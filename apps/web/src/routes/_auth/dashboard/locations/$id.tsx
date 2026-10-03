import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm, optional } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { LOCATION_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/locations/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit location - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const records = await context.queryClient.ensureQueryData(
      context.trpc.locations.list.queryOptions(),
    );
    if (!records.some((record) => record.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.locations.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);
  const { tracking, commit, discard } = usePendingImageDeletes();

  const updateMutation = useAdminMutation(trpc.locations.update.mutationOptions(), {
    invalidates: "locations",
    success: "Location updated",
    failure: "Failed to update location",
    reloadOnConflict: true,
    onSuccess: () => commit(),
    onError: (_error, variables) => discard(variables.flagUrl),
  });
  const deleteMutation = useAdminMutation(trpc.locations.delete.mutationOptions(), {
    invalidates: "locations",
    success: "Location deleted",
    failure: "Failed to delete location",
    onSuccess: () => navigate({ to: "/dashboard/locations" }),
  });

  if (!record) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/locations"
        backLabel="Locations"
        title={record.name}
        description="Edit the location's details."
        actions={
          <ConfirmDeleteButton
            label="Delete location"
            title="Delete this location?"
            itemName={record.name}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={LOCATION_SECTIONS}
        defaultValues={{ name: record.name, type: record.type, flagUrl: record.flagUrl ?? "" }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            name: values.name!,
            type: values.type as "city" | "state" | "country",
            flagUrl: optional(values.flagUrl!),
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/locations"
        images={tracking}
      />
    </>
  );
}
