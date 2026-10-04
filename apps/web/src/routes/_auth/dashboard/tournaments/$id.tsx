import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { CompetitionTier } from "@fsx/api/circuit-types";

import { EntityForm, optional, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { TournamentRatingResults } from "@/components/rating-update/tournament-rating-results";
import { useAdminMutation } from "@/lib/admin-mutations";
import { tournamentSections } from "@/lib/admin-forms";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournaments/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit tournament - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    Promise.all([
      orNotFound(
        context.queryClient.ensureQueryData(
          context.trpc.tournaments.byId.queryOptions({ id: params.id }),
        ),
      ),
      context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
      context.queryClient.ensureQueryData(
        context.trpc.playersTournament.listByTournament.queryOptions({ tournamentId: params.id }),
      ),
    ]),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: tournament } = useSuspenseQuery(trpc.tournaments.byId.queryOptions({ id }));
  const { data: championships } = useSuspenseQuery(trpc.champions.list.queryOptions());

  const updateMutation = useAdminMutation(trpc.tournaments.update.mutationOptions(), {
    invalidates: "tournaments",
    success: "Tournament updated",
    failure: "Failed to update tournament",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.tournaments.delete.mutationOptions(), {
    invalidates: "tournaments",
    success: "Tournament deleted",
    failure: "Failed to delete tournament",
    onSuccess: () => navigate({ to: "/dashboard/tournaments" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/tournaments"
        backLabel="Tournaments"
        title={tournament.name}
        description="Edit the tournament and review its rating results."
        actions={
          <ConfirmDeleteButton
            label="Delete tournament"
            title="Delete this tournament?"
            itemName={tournament.name}
            description={`“${tournament.name}” and its podiums will be permanently deleted. A tournament with rating results must have them reverted first. This cannot be undone.`}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={tournamentSections(championships)}
        defaultValues={{
          name: tournament.name,
          date: tournament.date ?? "",
          ratingType: tournament.ratingType,
          tier: tournament.tier,
          championshipId: tournament.championshipId ? String(tournament.championshipId) : "",
          chessResults: tournament.chessResults ?? "",
        }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            name: values.name!,
            date: optional(values.date!),
            ratingType: values.ratingType as "blitz" | "rapid" | "classic",
            tier: values.tier as CompetitionTier,
            championshipId: optionalNumber(values.championshipId!),
            chessResults: optional(values.chessResults!),
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/tournaments"
      />
      <TournamentRatingResults tournamentId={id} />
    </>
  );
}
