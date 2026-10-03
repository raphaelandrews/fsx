import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CHAMPIONSHIP_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/championships/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit championship - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const records = await context.queryClient.ensureQueryData(
      context.trpc.champions.list.queryOptions(),
    );
    if (!records.some((record) => record.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.champions.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.champions.update.mutationOptions(), {
    invalidates: "champions",
    success: "Championship updated",
    failure: "Failed to update championship",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.champions.delete.mutationOptions(), {
    invalidates: "champions",
    success: "Championship deleted",
    failure: "Failed to delete championship",
    onSuccess: () => navigate({ to: "/dashboard/championships" }),
  });

  if (!record) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/championships"
        backLabel="Championships"
        title={record.name}
        description="Edit the championship."
        actions={
          <ConfirmDeleteButton
            label="Delete championship"
            title="Delete this championship?"
            itemName={record.name}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={CHAMPIONSHIP_SECTIONS}
        defaultValues={{ name: record.name }}
        onSubmit={(values) => updateMutation.mutate({ id, name: values.name! })}
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/championships"
      />
    </>
  );
}
