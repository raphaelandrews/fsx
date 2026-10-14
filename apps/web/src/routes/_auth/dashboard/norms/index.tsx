import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityListPage, entityMessages } from "@/components/admin/entity-pages";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/")({
  head: () => ({ meta: [{ title: "Norms - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.norms.list.queryOptions()),
  component: RouteComponent,
});

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.norms.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.norms.delete.mutationOptions(), {
    invalidates: "norms",
    ...entityMessages("norm").delete,
  });

  return (
    <EntityListPage
      noun="norm"
      plural="norms"
      basePath="/dashboard/norms"
      title="Norms"
      description="Manage technical norms."
      rows={rows}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
    />
  );
}
