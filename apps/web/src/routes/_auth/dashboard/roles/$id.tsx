import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { ROLE_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/roles/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit role - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const records = await context.queryClient.ensureQueryData(
      context.trpc.roles.list.queryOptions(),
    );
    if (!records.some((record) => record.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.roles.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.roles.update.mutationOptions(), {
    invalidates: "roles",
    success: "Role updated",
    failure: "Failed to update role",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.roles.delete.mutationOptions(), {
    invalidates: "roles",
    success: "Role deleted",
    failure: "Failed to delete role",
    onSuccess: () => navigate({ to: "/dashboard/roles" }),
  });

  if (!record) return null;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/roles"
        backLabel="Roles"
        title={record.name}
        description="Edit the role's details."
        actions={
          <ConfirmDeleteButton
            label="Delete role"
            title="Delete this role?"
            itemName={record.name}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={ROLE_SECTIONS}
        defaultValues={{ name: record.name, shortName: record.shortName, type: record.type }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            name: values.name!,
            shortName: values.shortName!,
            type: values.type as "management" | "referee" | "teacher",
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/roles"
      />
    </>
  );
}
