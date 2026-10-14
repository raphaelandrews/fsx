import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityEditPage } from "@/components/admin/entity-pages";
import { ensureListRecord, entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { ROLE_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/roles/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit role - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.roles.list.queryOptions()),
      params.id,
    ),
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
    ...entityMessages("role").update,
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.roles.delete.mutationOptions(), {
    invalidates: "roles",
    ...entityMessages("role").delete,
    onSuccess: () => navigate({ to: "/dashboard/roles" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      noun="role"
      basePath="/dashboard/roles"
      backLabel="Roles"
      description="Edit the role's details."
      name={record.name}
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
      onDelete={() => deleteMutation.mutate({ id })}
      deleting={deleteMutation.isPending}
    />
  );
}
