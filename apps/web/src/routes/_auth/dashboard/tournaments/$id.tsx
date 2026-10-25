import { ChangeHistory } from "@/components/admin/change-history";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { CompetitionTier } from "@fsx/api/circuit-types";

import { EntityForm, optional, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { TierSuggestionNote } from "@/components/admin/tier-suggestion-note";
import { TournamentCircuitStages } from "@/components/admin/tournament-circuit-stages";
import { TournamentPodiums } from "@/components/admin/tournament-podiums";
import { TournamentRatingResults } from "@/components/rating-update/tournament-rating-results";
import { useAdminMutation } from "@/lib/admin-mutations";
import { tournamentSections } from "@/lib/admin-forms";
import { useScoringSchemeOptions } from "@/lib/reference-options";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

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
      context.queryClient.ensureQueryData(context.trpc.tournaments.suggestedTier.queryOptions({ id: params.id })),
      context.queryClient.ensureQueryData(
        context.trpc.playersTournament.listByTournament.queryOptions({ tournamentId: params.id }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.tournamentPodiums.listByTournament.queryOptions({ tournamentId: params.id }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.circuits.phases.listByTournament.queryOptions({ tournamentId: params.id }),
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
  const schemes = useScoringSchemeOptions();

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
        description="Edit the tournament and manage its podiums and review its rating results."
        actions={
          <ConfirmDeleteButton
            label="Delete tournament"
            title="Delete this tournament?"
            itemName={tournament.name}
            target={{ entity: "tournament", id }}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <TierSuggestionNote tournamentId={id} />
      <EntityForm
        sections={tournamentSections(championships, schemes)}
        defaultValues={{
          name: tournament.name,
          date: tournament.date ?? "",
          ratingType: tournament.ratingType,
          tier: tournament.tier,
          hasPodiums: String(tournament.hasPodiums),
          championshipId: tournament.championshipId ? String(tournament.championshipId) : "",
          chessResults: tournament.chessResults ?? "",
          scoringSchemeId: tournament.scoringSchemeId ? String(tournament.scoringSchemeId) : "",
        }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            name: values.name!,
            date: optional(values.date!),
            ratingType: values.ratingType as "blitz" | "rapid" | "classic",
            tier: values.tier as CompetitionTier,
            hasPodiums: values.hasPodiums !== "false",
            championshipId: optionalNumber(values.championshipId!),
            chessResults: optional(values.chessResults!),
            scoringSchemeId: optionalNumber(values.scoringSchemeId!),
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/tournaments"
      />
      <TournamentCircuitStages tournamentId={id} />
      {tournament.hasPodiums ? (
        <TournamentPodiums tournamentId={id} />
      ) : (
        <p className="mt-10 text-muted-foreground text-sm">Podiums are turned off for this tournament. Turn them on above to record places or to get medals from circuit stages.</p>
      )}
      <TournamentRatingResults tournamentId={id} />
      <ChangeHistory entity="tournament" recordId={id} />
    </>
  );
}
