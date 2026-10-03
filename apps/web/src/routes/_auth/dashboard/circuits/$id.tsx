import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { CircuitType } from "@fsx/api/circuit-types";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CircuitEditor } from "@/components/circuitos/admin/circuit-editor";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CIRCUIT_SECTIONS } from "@/lib/admin-forms";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/circuits/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit circuit - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        context.trpc.circuits.byId.queryOptions({ id: params.id }),
      ),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: circuit } = useSuspenseQuery(trpc.circuits.byId.queryOptions({ id }));

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

  const podiumCount =
    circuit.circuitPodiums.length +
    circuit.circuitPhases.reduce((sum, phase) => sum + phase.circuitPodiums.length, 0);

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/circuits"
        backLabel="Circuits"
        title={circuit.name}
        description="Edit the circuit, its stages, and its podiums."
        actions={
          <ConfirmDeleteButton
            label="Delete circuit"
            title="Delete this circuit?"
            itemName={circuit.name}
            description={`“${circuit.name}”, its ${circuit.circuitPhases.length} stage(s), and ${podiumCount} podium(s) will be permanently deleted. This cannot be undone.`}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={CIRCUIT_SECTIONS}
        defaultValues={{ name: circuit.name, type: circuit.type }}
        onSubmit={(values) =>
          updateMutation.mutate({ id, name: values.name!, type: values.type as CircuitType })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/circuits"
      />
      <CircuitEditor circuit={circuit} />
    </>
  );
}
