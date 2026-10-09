import { useRef } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { buttonVariants } from "@fsx/ui/components/button";

import { AdminPageHeader } from "@/components/admin/page-header";
import { MergePlayerButton } from "@/components/admin/merge-player-button";
import { PlayerForm, type RatingType } from "@/components/admin/player-form";
import {
  PlayerInsigniasSection,
  PlayerRolesSection,
  PlayerTitlesSection,
} from "@/components/admin/player-relations";
import { RatingHistoryEditor } from "@/components/rating-update/rating-history-editor";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { orNotFound, showMutationError } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/players/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit player - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    await Promise.all([
      orNotFound(
        context.queryClient.ensureQueryData(
          context.trpc.players.forEdit.queryOptions({ id: params.id }),
        ),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.playersToTitles.listByPlayer.queryOptions({ playerId: params.id }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.playersToRoles.listByPlayer.queryOptions({ playerId: params.id }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.playersToInsignias.listByPlayer.queryOptions({ playerId: params.id }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.playersTournament.listByPlayer.queryOptions({ playerId: params.id }),
      ),
      context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.roles.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.insignias.list.queryOptions()),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const invalidateAdmin = useInvalidateAdmin();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();
  const setRatingRef = useRef<((ratingType: RatingType, rating: number) => void) | null>(null);

  const { data: player } = useSuspenseQuery(trpc.players.forEdit.queryOptions({ id }));
  const { data: clubs } = useSuspenseQuery(trpc.clubs.list.queryOptions());
  const { data: locations } = useSuspenseQuery(trpc.locations.list.queryOptions());

  const updateMutation = useMutation({
    ...trpc.players.update.mutationOptions(),
    onSuccess: async () => {
      void invalidateAdmin("players");
      await commit();
      toast.success("Player updated");
    },
    onError: (error, variables) => {
      void discard(variables.imageUrl);
      showMutationError(error, "Failed to update player", () => window.location.reload());
    },
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/players"
        backLabel="Players"
        title={player.name}
        description="Clear Active to hide a player from the rankings. Duplicates can be combined with Merge into."
        actions={
          <>
            <MergePlayerButton playerId={id} playerName={player.name} />
            <Link
              to="/jogadores/$id"
              params={{ id }}
              className={buttonVariants({ variant: "outline" })}
            >
              View public profile
            </Link>
          </>
        }
      />
      <PlayerForm
        defaultValues={{
          name: player.name,
          nickname: player.nickname ?? "",
          birthDate: player.birthDate ?? "",
          sex: player.sex as "male" | "female",
          imageUrl: player.imageUrl ?? "",
          clubId: player.clubId,
          locationId: player.locationId,
          classic: player.classic,
          rapid: player.rapid,
          blitz: player.blitz,
          cbxId: player.cbxId,
          fideId: player.fideId,
          active: player.active,
          verified: player.verified,
        }}
        onSubmit={(values, editedRatings) => {
          const { classic, rapid, blitz, ...rest } = values;
          const ratings = { classic, rapid, blitz };
          updateMutation.mutate({
            id,
            ...rest,
            nickname: rest.nickname || null,
            birthDate: rest.birthDate || null,
            imageUrl: rest.imageUrl || null,
            ...Object.fromEntries(
              editedRatings.map((ratingType) => [ratingType, ratings[ratingType]]),
            ),
          });
        }}
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/players"
        locations={locations}
        clubName={clubs.find((club) => club.id === player.clubId)?.name}
        ratingsHint="Editing a rating here is not recorded in the rating history. To fix a tournament result, use Rating history below."
        onImageReplaced={trackReplaced}
        onImageUploaded={trackCreated}
        setRatingRef={setRatingRef}
      />
      <RatingHistoryEditor
        playerId={id}
        onRatingChange={(ratingType, rating) => setRatingRef.current?.(ratingType, rating)}
      />
      <PlayerTitlesSection playerId={id} />
      <PlayerRolesSection playerId={id} />
      <PlayerInsigniasSection playerId={id} />
    </>
  );
}
