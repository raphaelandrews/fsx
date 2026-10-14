import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityEditPage, ensureListRecord, entityMessages } from "@/components/admin/entity-pages";
import { useAdminMutation } from "@/lib/admin-mutations";
import { NORM_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit norm - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.norms.list.queryOptions()),
      params.id,
    ),
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
    ...entityMessages("norm").update,
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.norms.delete.mutationOptions(), {
    invalidates: "norms",
    ...entityMessages("norm").delete,
    onSuccess: () => navigate({ to: "/dashboard/norms" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      noun="norm"
      basePath="/dashboard/norms"
      backLabel="Norms"
      description="Edit the norm."
      name={record.name}
      sections={NORM_SECTIONS}
      defaultValues={{ name: record.name }}
      onSubmit={(values) =>
        updateMutation.mutate({
          id,
          name: values.name!,
        })
      }
      error={updateMutation.error}
      pending={updateMutation.isPending}
      onDelete={() => deleteMutation.mutate({ id })}
      deleting={deleteMutation.isPending}
    />
  );
}
