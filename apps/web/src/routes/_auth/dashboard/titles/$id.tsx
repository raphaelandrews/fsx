import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { TITLE_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/titles/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit title - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const records = await context.queryClient.ensureQueryData(
      context.trpc.titles.list.queryOptions(),
    );
    if (!records.some((record) => record.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.titles.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.titles.update.mutationOptions(), {
    invalidates: "titles",
    success: "Title updated",
    failure: "Failed to update title",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.titles.delete.mutationOptions(), {
    invalidates: "titles",
    success: "Title deleted",
    failure: "Failed to delete title",
    onSuccess: () => navigate({ to: "/dashboard/titles" }),
  });

  if (!record) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/titles"
        backLabel="Titles"
        title={record.name}
        description="Edit the title's details."
        actions={
          <ConfirmDeleteButton
            label="Delete title"
            title="Delete this title?"
            itemName={record.name}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={TITLE_SECTIONS}
        defaultValues={{
          name: record.name,
          shortName: record.shortName,
          type: record.type,
          tier: String(record.tier),
          losesAtAge: record.losesAtAge ? String(record.losesAtAge) : "",
        }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            name: values.name!,
            shortName: values.shortName!,
            type: values.type as "internal" | "external",
            tier: Number(values.tier),
            losesAtAge: optionalNumber(values.losesAtAge!),
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/titles"
      />
    </>
  );
}
