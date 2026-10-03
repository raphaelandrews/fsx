import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { ANNOUNCEMENT_SECTIONS } from "@/lib/admin-forms";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";
import { padNumber } from "@/utils/format";

export const Route = createFileRoute("/_auth/dashboard/announcements/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit announcement - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        context.trpc.announcements.byId.queryOptions({ id: params.id }),
      ),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: announcement } = useSuspenseQuery(trpc.announcements.byId.queryOptions({ id }));

  const updateMutation = useAdminMutation(trpc.announcements.update.mutationOptions(), {
    invalidates: "announcements",
    success: "Announcement updated",
    failure: "Failed to update announcement",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.announcements.delete.mutationOptions(), {
    invalidates: "announcements",
    success: "Announcement deleted",
    failure: "Failed to delete announcement",
    onSuccess: () => navigate({ to: "/dashboard/announcements" }),
  });

  const label = `Comunicado ${padNumber(announcement.number)}/${announcement.year}`;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/announcements"
        backLabel="Announcements"
        title={label}
        description="Edit the announcement."
        actions={
          <ConfirmDeleteButton
            label="Delete announcement"
            title="Delete this announcement?"
            itemName={label}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={ANNOUNCEMENT_SECTIONS}
        defaultValues={{
          year: String(announcement.year),
          number: String(announcement.number),
          content: announcement.content,
        }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            year: Number(values.year),
            number: Number(values.number),
            content: values.content!,
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/announcements"
      />
    </>
  );
}
