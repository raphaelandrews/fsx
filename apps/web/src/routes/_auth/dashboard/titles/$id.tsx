import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { optionalNumber } from "@/components/admin/entity-form";
import { EntityEditPage, ensureListRecord, entityMessages } from "@/components/admin/entity-pages";
import { useAdminMutation } from "@/lib/admin-mutations";
import { TITLE_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/titles/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit title - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
      params.id,
    ),
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
    ...entityMessages("title").update,
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.titles.delete.mutationOptions(), {
    invalidates: "titles",
    ...entityMessages("title").delete,
    onSuccess: () => navigate({ to: "/dashboard/titles" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      noun="title"
      basePath="/dashboard/titles"
      backLabel="Titles"
      description="Edit the title's details."
      name={record.name}
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
      onDelete={() => deleteMutation.mutate({ id })}
      deleting={deleteMutation.isPending}
    />
  );
}
