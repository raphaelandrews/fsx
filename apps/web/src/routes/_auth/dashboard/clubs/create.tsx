import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm, optional } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CLUB_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

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
    success: "Club created",
    failure: "Failed to create club",
    onSuccess: async () => {
      await commit();
      await navigate({ to: "/dashboard/clubs" });
    },
    onError: (_error, variables) => discard(variables.logoUrl),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/clubs"
        backLabel="Clubs"
        title="New club"
        description="Add a club or school."
      />
      <EntityForm
        sections={CLUB_SECTIONS}
        defaultValues={{ name: "", logoUrl: "" }}
        onSubmit={(values) =>
          createMutation.mutate({ name: values.name!, logoUrl: optional(values.logoUrl!) })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create club"
        cancelTo="/dashboard/clubs"
        images={tracking}
      />
    </>
  );
}
