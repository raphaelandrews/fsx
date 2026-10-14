import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { optional } from "@/components/admin/entity-form";
import { EntityEditPage } from "@/components/admin/entity-pages";
import { ensureListRecord, entityMessages } from "@/lib/entity-routes";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { LOCATION_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/locations/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit location - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
      params.id,
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { tracking, commit, discard } = usePendingImageDeletes();

  const { data: records } = useSuspenseQuery(trpc.locations.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.locations.update.mutationOptions(), {
    invalidates: "locations",
    ...entityMessages("location").update,
    reloadOnConflict: true,
    onSuccess: () => commit(),
    onError: (_error, variables) => discard(variables.flagUrl),
  });
  const deleteMutation = useAdminMutation(trpc.locations.delete.mutationOptions(), {
    invalidates: "locations",
    ...entityMessages("location").delete,
    onSuccess: () => navigate({ to: "/dashboard/locations" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      noun="location"
      basePath="/dashboard/locations"
      backLabel="Locations"
      description="Edit the location's details."
      name={record.name}
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
      onDelete={() => deleteMutation.mutate({ id })}
      deleting={deleteMutation.isPending}
      images={tracking}
    />
  );
}
