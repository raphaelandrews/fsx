import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { NORM_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit norm - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const records = await context.queryClient.ensureQueryData(
      context.trpc.norms.list.queryOptions(),
    );
    if (!records.some((record) => record.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.norms.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.norms.update.mutationOptions(), {
    invalidates: "norms",
    success: "Norm updated",
    failure: "Failed to update norm",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.norms.delete.mutationOptions(), {
    invalidates: "norms",
    success: "Norm deleted",
    failure: "Failed to delete norm",
    onSuccess: () => navigate({ to: "/dashboard/norms" }),
  });

  if (!record) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/norms"
        backLabel="Norms"
        title={record.name}
        description="Edit the norm."
        actions={
          <ConfirmDeleteButton
            label="Delete norm"
            title="Delete this norm?"
            itemName={record.name}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={NORM_SECTIONS}
        defaultValues={{ name: record.name }}
        onSubmit={(values) => updateMutation.mutate({ id, name: values.name! })}
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/norms"
      />
    </>
  );
}
