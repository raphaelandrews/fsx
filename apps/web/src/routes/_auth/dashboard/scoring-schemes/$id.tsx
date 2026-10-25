import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityEditPage } from "@/components/admin/entity-pages";
import { ensureListRecord, entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { SCORING_SCHEME_SECTIONS, parseSchemePoints } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/scoring-schemes/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit scoring scheme - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    ensureListRecord(
      context.queryClient.ensureQueryData(context.trpc.scoringSchemes.list.queryOptions()),
      params.id,
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: records } = useSuspenseQuery(trpc.scoringSchemes.list.queryOptions());
  const record = records.find((candidate) => candidate.id === id);

  const updateMutation = useAdminMutation(trpc.scoringSchemes.update.mutationOptions(), {
    invalidates: "scoringSchemes",
    ...entityMessages("scoring scheme").update,
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.scoringSchemes.delete.mutationOptions(), {
    invalidates: "scoringSchemes",
    ...entityMessages("scoring scheme").delete,
    onSuccess: () => navigate({ to: "/dashboard/scoring-schemes" }),
  });

  if (!record) return null;

  return (
    <EntityEditPage
      id={id}
      noun="scoring scheme"
      basePath="/dashboard/scoring-schemes"
      backLabel="Scoring schemes"
      description="Edit the scheme. Results already saved keep the points they have."
      name={record.name}
      sections={SCORING_SCHEME_SECTIONS}
      defaultValues={{ name: record.name, points: record.places.map((entry) => entry.points).join(", ") }}
      onSubmit={(values) => {
        const places = parseSchemePoints(values.points!);
        if (places) updateMutation.mutate({ id, name: values.name!, places });
      }}
      error={updateMutation.error}
      pending={updateMutation.isPending}
      onDelete={() => deleteMutation.mutate({ id })}
      deleting={deleteMutation.isPending}
    />
  );
}
