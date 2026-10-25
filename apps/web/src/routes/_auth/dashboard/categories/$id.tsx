import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityEditPage } from "@/components/admin/entity-pages";
import { optionalNumber } from "@/components/admin/entity-form";
import { ensureListRecord, entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CATEGORY_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/categories/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit category - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.categories.list.queryOptions()),
      params.id,
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.categories.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.categories.update.mutationOptions(), {
    invalidates: "categories",
    ...entityMessages("category").update,
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.categories.delete.mutationOptions(), {
    invalidates: "categories",
    ...entityMessages("category").delete,
    onSuccess: () => navigate({ to: "/dashboard/categories" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      id={id}
      noun="category"
      basePath="/dashboard/categories"
      backLabel="Categories"
      description="Edit the category. Renaming it renames it on every podium and result."
      name={record.name}
      sections={CATEGORY_SECTIONS}
      defaultValues={{
        name: record.name,
        kind: record.kind,
        sex: record.sex ?? "male",
        ageLimit: record.ageLimit ? String(record.ageLimit) : "",
        sortOrder: String(record.sortOrder),
      }}
      onSubmit={(values) =>
        updateMutation.mutate({
          id,
          name: values.name!,
          kind: values.kind as "age" | "open",
          sex: values.kind === "age" ? (values.sex as "male" | "female") : null,
          ageLimit: values.kind === "age" ? optionalNumber(values.ageLimit!) : null,
          sortOrder: Number(values.sortOrder),
        })
      }
      error={updateMutation.error}
      pending={updateMutation.isPending}
      onDelete={() => deleteMutation.mutate({ id })}
      deleting={deleteMutation.isPending}
    />
  );
}
