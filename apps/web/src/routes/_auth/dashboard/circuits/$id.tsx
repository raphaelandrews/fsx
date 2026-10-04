import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { CircuitType, CompetitionTier } from "@fsx/api/circuit-types";

import { EntityForm, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CircuitEditor } from "@/components/circuitos/admin/circuit-editor";
import { CircuitFinalPodiums } from "@/components/circuitos/admin/circuit-final-podiums";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { circuitSections } from "@/lib/admin-forms";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/circuits/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit circuit - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    Promise.all([
      orNotFound(
        context.queryClient.ensureQueryData(
          context.trpc.circuits.byId.queryOptions({ id: params.id }),
        ),
      ),
      context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
    ]),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: circuit } = useSuspenseQuery(trpc.circuits.byId.queryOptions({ id }));
  const { data: championships } = useSuspenseQuery(trpc.champions.list.queryOptions());

  const updateMutation = useAdminMutation(trpc.circuits.update.mutationOptions(), {
    invalidates: "circuits",
    success: "Circuit updated",
    failure: "Failed to update circuit",
    reloadOnConflict: true,
  });
  const deleteMutation = useAdminMutation(trpc.circuits.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Circuit deleted",
    failure: "Failed to delete circuit",
    onSuccess: () => navigate({ to: "/dashboard/circuits" }),
  });

  const resultCount =
    circuit.circuitPodiums.length +
    circuit.circuitPhases.reduce((sum, phase) => sum + phase.circuitPodiums.length, 0);

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/circuits"
        backLabel="Circuits"
        title={circuit.name}
        description="Edit the season, its stages and points, and its final podiums."
        actions={
          circuit.finishedAt ? null : (
            <ConfirmDeleteButton
              label="Delete circuit"
              title="Delete this circuit?"
              itemName={circuit.name}
              description={`“${circuit.name}”, its ${circuit.circuitPhases.length} stage(s), and ${resultCount} result(s) will be permanently deleted. To start a new season, create a new circuit instead. This cannot be undone.`}
              pending={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate({ id })}
            />
          )
        }
      />
      <EntityForm
        sections={circuitSections(championships)}
        defaultValues={{
          name: circuit.name,
          year: circuit.year ? String(circuit.year) : "",
          type: circuit.type,
          tier: circuit.tier,
          championshipId: circuit.championshipId ? String(circuit.championshipId) : "",
        }}
        onSubmit={(values) =>
          updateMutation.mutate({
            id,
            name: values.name!,
            year: Number(values.year),
            type: values.type as CircuitType,
            tier: values.tier as CompetitionTier,
            championshipId: optionalNumber(values.championshipId!),
          })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/circuits"
      />
      <CircuitEditor circuit={circuit} />
      <CircuitFinalPodiums circuit={circuit} />
    </>
  );
}
