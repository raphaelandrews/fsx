import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { optional } from "@/components/admin/entity-form";
import { EntityCreatePage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CLUB_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/clubs/create")({
  head: () => ({ meta: [{ title: "New club - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { tracking, commit, discard } = usePendingImageDeletes();

  const createMutation = useAdminMutation(trpc.clubs.create.mutationOptions(), {
    invalidates: "clubs",
    ...entityMessages("club").create,
    onSuccess: async () => {
      await commit();
      await navigate({ to: "/dashboard/clubs" });
    },
    onError: (_error, variables) => discard(variables.logoUrl),
  });

  return (
    <EntityCreatePage
      noun="club"
      basePath="/dashboard/clubs"
      backLabel="Clubs"
      description="Add a club or school."
      sections={CLUB_SECTIONS}
      defaultValues={{ name: "", logoUrl: "" }}
      onSubmit={(values) =>
        createMutation.mutate({
          name: values.name!,
          logoUrl: optional(values.logoUrl!),
        })
      }
      error={createMutation.error}
      pending={createMutation.isPending}
      images={tracking}
    />
  );
}
