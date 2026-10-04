import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { CompetitionCategory } from "@fsx/api/circuit-types";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { tournamentPodiumSections } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit podium - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const podiums = await context.queryClient.ensureQueryData(
      context.trpc.tournamentPodiums.list.queryOptions(),
    );
    if (!podiums.some((podium) => podium.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: podiums } = useSuspenseQuery(trpc.tournamentPodiums.list.queryOptions());
  const podium = podiums.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.tournamentPodiums.update.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium updated",
    failure: "Failed to update podium",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.tournamentPodiums.delete.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium deleted",
    failure: "Failed to delete podium",
    onSuccess: () => navigate({ to: "/dashboard/tournament-podiums" }),
  });

  if (!podium) return null;
  const summary = `${podium.player?.name ?? "Player"} · ${podium.place}º${podium.category ? ` ${podium.category}` : ""} in ${podium.tournament?.name ?? "tournament"}`;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/tournament-podiums"
        backLabel="Tournament podiums"
        title={summary}
        description="Edit the podium."
        actions={
          <ConfirmDeleteButton
            label="Delete podium"
            title="Delete this podium?"
            itemName={summary}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={tournamentPodiumSections(trpc, {
          player: podium.player?.name,
          tournament: podium.tournament?.name,
        })}
        defaultValues={{
          tournamentId: String(podium.tournamentId),
          playerId: String(podium.playerId),
          place: String(podium.place),
          category: podium.category ?? "",
        }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            tournamentId: Number(values.tournamentId),
            playerId: Number(values.playerId),
            place: Number(values.place),
            category: (values.category || null) as CompetitionCategory | null,
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/tournament-podiums"
      />
    </>
  );
}
