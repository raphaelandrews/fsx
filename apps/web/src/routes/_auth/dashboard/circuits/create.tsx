import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { CircuitType, CompetitionTier } from "@fsx/api/circuit-types";

import { EntityForm, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { circuitSections } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/circuits/create")({
  head: () => ({ meta: [{ title: "New circuit - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: championships } = useSuspenseQuery(trpc.champions.list.queryOptions());

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
        description="Create one circuit per season; you add its stages and points on the next page."
      />
      <EntityForm
        sections={circuitSections(championships)}
        defaultValues={{
          name: "",
          year: String(new Date().getFullYear()),
          type: "default",
          tier: "B",
          championshipId: "",
        }}
        onSubmit={(values) =>
          createMutation.mutate({
            name: values.name!,
            year: Number(values.year),
            type: values.type as CircuitType,
            tier: values.tier as CompetitionTier,
            championshipId: optionalNumber(values.championshipId!),
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create circuit"
        cancelTo="/dashboard/circuits"
      />
    </>
  );
}
