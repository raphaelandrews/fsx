import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PlayerForm } from "@/components/admin/player-form";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/players/create")({
  head: () => ({ meta: [{ title: "New player - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();
  const { data: locations } = useSuspenseQuery(trpc.locations.list.queryOptions());

  const createMutation = useAdminMutation(trpc.players.create.mutationOptions(), {
    invalidates: "players",
    success: "Player created",
    failure: "Failed to create player",
    onSuccess: async () => {
      await commit();
      await navigate({ to: "/dashboard/players" });
    },
    onError: (_error, variables) => discard(variables.imageUrl),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/players"
        backLabel="Players"
        title="New player"
        description="Register a player with the federation."
      />
      <PlayerForm
        defaultValues={{
          name: "",
          nickname: "",
          birthYear: "",
          sex: "male",
          imageUrl: "",
          clubId: null,
          locationId: null,
          classic: 1900,
          rapid: 1900,
          blitz: 1900,
          cbxId: null,
          fideId: null,
          active: true,
          verified: false,
        }}
        onSubmit={(values) =>
          createMutation.mutate({
            ...values,
            nickname: values.nickname || null,
            birthYear: values.birthYear ? Number(values.birthYear) : null,
            imageUrl: values.imageUrl || null,
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create player"
        cancelTo="/dashboard/players"
        locations={locations}
        onImageReplaced={trackReplaced}
        onImageUploaded={trackCreated}
      />
    </>
  );
}
