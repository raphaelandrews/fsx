import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { optional } from "@/components/admin/entity-form";
import { EntityEditPage, ensureListRecord, entityMessages } from "@/components/admin/entity-pages";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CLUB_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/clubs/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit club - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
      params.id,
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { tracking, commit, discard } = usePendingImageDeletes();

  const { data: records } = useSuspenseQuery(trpc.clubs.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.clubs.update.mutationOptions(), {
    invalidates: "clubs",
    ...entityMessages("club").update,
    reloadOnConflict: true,
    onSuccess: () => commit(),
    onError: (_error, variables) => discard(variables.logoUrl),
  });
  const deleteMutation = useAdminMutation(trpc.clubs.delete.mutationOptions(), {
    invalidates: "clubs",
    ...entityMessages("club").delete,
    onSuccess: () => navigate({ to: "/dashboard/clubs" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      noun="club"
      basePath="/dashboard/clubs"
      backLabel="Clubs"
      description="Edit the club's details."
      name={record.name}
      sections={CLUB_SECTIONS}
      defaultValues={{ name: record.name, logoUrl: record.logoUrl ?? "" }}
      onSubmit={(values) =>
        updateMutation.mutate({
          id,
          name: values.name!,
          logoUrl: optional(values.logoUrl!),
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
