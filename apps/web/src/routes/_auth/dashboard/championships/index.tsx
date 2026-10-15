import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityListPage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";
import { CHAMPIONSHIP_SECTIONS } from "@/lib/admin-forms";

export const Route = createFileRoute("/_auth/dashboard/championships/")({
  head: () => ({ meta: [{ title: "Championships - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
  component: RouteComponent,
});

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.champions.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.champions.delete.mutationOptions(), {
    invalidates: "champions",
    ...entityMessages("championship").delete,
  });

  const createMutation = useAdminMutation(trpc.champions.create.mutationOptions(), {
    invalidates: "champions",
    ...entityMessages("championship").create,
  });

  return (
    <EntityListPage
      noun="championship"
      plural="championships"
      basePath="/dashboard/championships"
      title="Championships"
      description="Recurring competitions. Their tournaments' podiums feed the champions gallery."
      rows={rows}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
      create={{
        description: "Add a recurring competition.",
        sections: CHAMPIONSHIP_SECTIONS,
        defaultValues: { name: "" },
        onSubmit: (values, close) =>
          createMutation.mutate(
            {
              name: values.name!,
            },
            { onSuccess: close },
          ),
        error: createMutation.error,
        pending: createMutation.isPending,
      }}
    />
  );
}
