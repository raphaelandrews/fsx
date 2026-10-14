import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityEditPage } from "@/components/admin/entity-pages";
import { ensureListRecord, entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { INSIGNIA_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/insignias/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit insignia - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.insignias.list.queryOptions()),
      params.id,
    ),
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
    ...entityMessages("insignia").update,
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.insignias.delete.mutationOptions(), {
    invalidates: "insignias",
    ...entityMessages("insignia").delete,
    onSuccess: () => navigate({ to: "/dashboard/insignias" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      noun="insignia"
      basePath="/dashboard/insignias"
      backLabel="Insignias"
      description="Edit the insignia's details."
      name={record.name}
      sections={INSIGNIA_SECTIONS}
      defaultValues={{ name: record.name, level: String(record.level) }}
      onSubmit={(values) =>
        updateMutation.mutate({
          id,
          name: values.name!,
          level: Number(values.level),
        })
      }
      error={updateMutation.error}
      pending={updateMutation.isPending}
      onDelete={() => deleteMutation.mutate({ id })}
      deleting={deleteMutation.isPending}
    />
  );
}
