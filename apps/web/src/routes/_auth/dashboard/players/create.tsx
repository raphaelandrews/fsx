import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PlayerForm } from "@/components/admin/player-form";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { showMutationError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/players/create")({
  head: () => ({ meta: [{ title: "New player - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();
  const { data: locations } = useSuspenseQuery(trpc.locations.list.queryOptions());

  const createMutation = useMutation({
    ...trpc.players.create.mutationOptions(),
    onSuccess: async () => {
      void invalidateAdmin("players");
      await commit();
      toast.success("Player created");
      await navigate({ to: "/dashboard/players" });
    },
    onError: (error, variables) => {
      void discard(variables.imageUrl);
      showMutationError(error, "Failed to create player");
    },
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
          birthDate: "",
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
            birthDate: values.birthDate || null,
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
