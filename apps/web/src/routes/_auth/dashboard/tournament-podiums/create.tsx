import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { tournamentPodiumSections } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/create")({
  head: () => ({ meta: [{ title: "New podium - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.tournamentPodiums.create.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium created",
    failure: "Failed to create podium",
    onSuccess: () => navigate({ to: "/dashboard/tournament-podiums" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/tournament-podiums"
        backLabel="Tournament podiums"
        title="New podium"
        description="Record a player's final place in a tournament."
      />
      <EntityForm
        sections={tournamentPodiumSections(trpc)}
        defaultValues={{ tournamentId: "", playerId: "", place: "1" }}
        onSubmit={(values) =>
          createMutation.mutate({
            tournamentId: Number(values.tournamentId),
            playerId: Number(values.playerId),
            place: Number(values.place),
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create podium"
        cancelTo="/dashboard/tournament-podiums"
      />
    </>
  );
}
