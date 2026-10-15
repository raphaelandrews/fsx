import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityListPage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";
import { CLUB_SECTIONS } from "@/lib/admin-forms";
import { optional } from "@/components/admin/entity-form";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";

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

  const { tracking, commit, discard } = usePendingImageDeletes();
  const createMutation = useAdminMutation(trpc.clubs.create.mutationOptions(), {
    invalidates: "clubs",
    ...entityMessages("club").create,
    onSuccess: async () => {
      await commit();
    },
    onError: (_error, variables) => discard(variables.logoUrl),
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
      create={{
        description: "Add a club or school.",
        sections: CLUB_SECTIONS,
        defaultValues: { name: "", logoUrl: "" },
        onSubmit: (values, close) =>
          createMutation.mutate(
            {
              name: values.name!,
              logoUrl: optional(values.logoUrl!),
            },
            { onSuccess: close },
          ),
        error: createMutation.error,
        pending: createMutation.isPending,
        images: tracking,
      }}
    />
  );
}
