import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityEditPage } from "@/components/admin/entity-pages";
import { ensureListRecord, entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CHAMPIONSHIP_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/championships/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit championship - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
      params.id,
    ),
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
    ...entityMessages("championship").update,
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.champions.delete.mutationOptions(), {
    invalidates: "champions",
    ...entityMessages("championship").delete,
    onSuccess: () => navigate({ to: "/dashboard/championships" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      noun="championship"
      basePath="/dashboard/championships"
      backLabel="Championships"
      description="Edit the championship."
      name={record.name}
      sections={CHAMPIONSHIP_SECTIONS}
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
