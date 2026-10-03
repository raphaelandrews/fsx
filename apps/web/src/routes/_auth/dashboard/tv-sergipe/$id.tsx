import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/page-header";
import { TvSergipeForm, toTvSergipeInput } from "@/components/admin/tv-sergipe-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tv-sergipe/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit School Games result - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const results = await context.queryClient.ensureQueryData(
      context.trpc.tvSergipe.list.queryOptions(),
    );
    if (!results.some((result) => result.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: results } = useSuspenseQuery(trpc.tvSergipe.list.queryOptions());
  const result = results.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.tvSergipe.update.mutationOptions(), {
    invalidates: "tvSergipe",
    success: "Result updated",
    failure: "Failed to update result",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.tvSergipe.delete.mutationOptions(), {
    invalidates: "tvSergipe",
    success: "Result deleted",
    failure: "Failed to delete result",
    onSuccess: () => navigate({ to: "/dashboard/tv-sergipe" }),
  });

  if (!result) return null;
  const participant =
    result.modality === "team" ? `Team ${result.teamName}` : (result.player?.name ?? "Player");
  const summary = `${result.club?.name ?? "School"} · ${participant} · ${result.place}º`;

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/tv-sergipe"
        backLabel="TV Sergipe"
        title={summary}
        description={`Under ${result.ageGroup} · ${result.sex === "male" ? "Male" : "Female"} · ${result.modality === "team" ? "Team" : "Individual"}`}
        actions={
          <ConfirmDeleteButton
            label="Delete result"
            title="Delete this result?"
            itemName={summary}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <TvSergipeForm
        defaultValues={{
          clubId: String(result.clubId),
          modality: result.modality as "individual" | "team",
          playerId: result.playerId ? String(result.playerId) : "",
          teamName: result.teamName ?? "A",
          ageGroup: result.ageGroup,
          sex: result.sex as "male" | "female",
          place: String(result.place),
        }}
        labels={{ club: result.club?.name, player: result.player?.name }}
        onSubmit={(values) => updateMutation.mutate({ id, ...toTvSergipeInput(values) })}
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/tv-sergipe"
      />
    </>
  );
}
