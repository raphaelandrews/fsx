import { createFileRoute, useNavigate } from "@tanstack/react-router";

import type { CircuitType } from "@fsx/api/circuit-types";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CIRCUIT_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/circuits/create")({
  head: () => ({ meta: [{ title: "New circuit - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.circuits.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Circuit created. Add its stages below.",
    failure: "Failed to create circuit",
    onSuccess: (created) => {
      const id = created[0]?.id;
      return id
        ? navigate({ to: "/dashboard/circuits/$id", params: { id } })
        : navigate({ to: "/dashboard/circuits" });
    },
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/circuits"
        backLabel="Circuits"
        title="New circuit"
        description="Name the circuit first; you add its stages and podiums on the next page."
      />
      <EntityForm
        sections={CIRCUIT_SECTIONS}
        defaultValues={{ name: "", type: "default" }}
        onSubmit={(values) =>
          createMutation.mutate({ name: values.name!, type: values.type as CircuitType })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create circuit"
        cancelTo="/dashboard/circuits"
      />
    </>
  );
}
