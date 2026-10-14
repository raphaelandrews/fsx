import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityListPage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/clubs/")({
  head: () => ({ meta: [{ title: "Clubs - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
  component: RouteComponent,
});

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.clubs.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.clubs.delete.mutationOptions(), {
    invalidates: "clubs",
    ...entityMessages("club").delete,
  });

  return (
    <EntityListPage
      noun="club"
      plural="clubs"
      basePath="/dashboard/clubs"
      title="Clubs"
      description="Manage the member clubs."
      rows={rows}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
    />
  );
}
