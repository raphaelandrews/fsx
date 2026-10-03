import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm, optional } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CLUB_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/clubs/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit club - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const records = await context.queryClient.ensureQueryData(
      context.trpc.clubs.list.queryOptions(),
    );
    if (!records.some((record) => record.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.clubs.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);
  const { tracking, commit, discard } = usePendingImageDeletes();

  const updateMutation = useAdminMutation(trpc.clubs.update.mutationOptions(), {
    invalidates: "clubs",
    success: "Club updated",
    failure: "Failed to update club",
    reloadOnConflict: true,
    onSuccess: () => commit(),
    onError: (_error, variables) => discard(variables.logoUrl),
  });
  const deleteMutation = useAdminMutation(trpc.clubs.delete.mutationOptions(), {
    invalidates: "clubs",
    success: "Club deleted",
    failure: "Failed to delete club",
    onSuccess: () => navigate({ to: "/dashboard/clubs" }),
  });

  if (!record) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/clubs"
        backLabel="Clubs"
        title={record.name}
        description="Edit the club's details."
        actions={
          <ConfirmDeleteButton
            label="Delete club"
            title="Delete this club?"
            itemName={record.name}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={CLUB_SECTIONS}
        defaultValues={{ name: record.name, logoUrl: record.logoUrl ?? "" }}
        onSubmit={(values) =>
          updateMutation.mutate({ id, name: values.name!, logoUrl: optional(values.logoUrl!) })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/clubs"
        images={tracking}
      />
    </>
  );
}
