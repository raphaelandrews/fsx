import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { INSIGNIA_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/insignias/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit insignia - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const records = await context.queryClient.ensureQueryData(
      context.trpc.insignias.list.queryOptions(),
    );
    if (!records.some((record) => record.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.insignias.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.insignias.update.mutationOptions(), {
    invalidates: "insignias",
    success: "Insignia updated",
    failure: "Failed to update insignia",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.insignias.delete.mutationOptions(), {
    invalidates: "insignias",
    success: "Insignia deleted",
    failure: "Failed to delete insignia",
    onSuccess: () => navigate({ to: "/dashboard/insignias" }),
  });

  if (!record) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/insignias"
        backLabel="Insignias"
        title={record.name}
        description="Edit the insignia's details."
        actions={
          <ConfirmDeleteButton
            label="Delete insignia"
            title="Delete this insignia?"
            itemName={record.name}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={INSIGNIA_SECTIONS}
        defaultValues={{ name: record.name, level: String(record.level) }}
        onSubmit={(values) =>
          updateMutation.mutate({ id, name: values.name!, level: Number(values.level) })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/insignias"
      />
    </>
  );
}
