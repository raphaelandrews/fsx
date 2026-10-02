import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import z from "zod";

import { CIRCUIT_TYPE_LABELS, CIRCUIT_TYPES, type CircuitType } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";

import { CircuitPhaseCard } from "@/components/circuitos/admin/circuit-phase-card";
import { CircuitPhaseForm } from "@/components/circuitos/admin/circuit-phase-form";
import { CircuitPodiumForm } from "@/components/circuitos/admin/circuit-podium-form";
import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";
import { fieldError, orNotFound } from "@/lib/errors";

export const Route = createFileRoute("/_auth/dashboard/circuits/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit Circuit - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        context.trpc.circuits.byId.queryOptions({ id: params.id }),
      ),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: numId } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: circuit } = useSuspenseQuery(trpc.circuits.byId.queryOptions({ id: numId }));

  const updateMutation = useAdminMutation(trpc.circuits.update.mutationOptions(), {
    invalidates: "circuits",
    success: "Circuit updated",
    failure: "Failed to update circuit",
    reloadOnConflict: true,
  });

  if (!circuit) return <p>Circuit not found.</p>;

  const form = useForm({
    defaultValues: {
      name: circuit.name,
      type: circuit.type as CircuitType,
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(CIRCUIT_TYPES),
      }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ id: numId, name: value.name, type: value.type });
    },
  });

  const phases = [...circuit.circuitPhases].sort((a, b) => a.sortOrder - b.sortOrder);
  const nextSortOrder = phases.reduce((max, phase) => Math.max(max, phase.sortOrder), 0) + 1;
  const directPodiums = [...circuit.circuitPodiums].sort(
    (a, b) => (b.points ?? 0) - (a.points ?? 0),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit circuit: {circuit.name}</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/circuits" })}>
          Voltar
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="name">
          {(f) => (
            <FormField
              label="Name"
              htmlFor={f.name}
              error={fieldError(f, updateMutation.error)}
              required
            >
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="type">
          {(f) => (
            <FormField label="Type" htmlFor={f.name} error={fieldError(f, updateMutation.error)}>
              <select
                id={f.name}
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value as CircuitType)}
                onBlur={f.handleBlur}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CIRCUIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CIRCUIT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || updateMutation.isPending}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-8">
        {circuit.type === "geral" ? (
          <section className="space-y-2">
            <h2 className="font-semibold text-lg">Overall standings</h2>
            <p className="text-sm text-muted-foreground">
              Circuito sem etapas: a lista abaixo é a classificação final.
            </p>
            {directPodiums.map((podium) => (
              <CircuitPodiumForm
                key={podium.id}
                target={{ circuitId: circuit.id }}
                podium={podium}
              />
            ))}
            <CircuitPodiumForm
              key={`new-${directPodiums.length}`}
              target={{ circuitId: circuit.id }}
            />
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="font-semibold text-lg">Etapas</h2>
            {phases.map((phase) => (
              <CircuitPhaseCard key={phase.id} circuitId={circuit.id} phase={phase} />
            ))}
            <CircuitPhaseForm
              key={`new-${phases.length}`}
              circuitId={circuit.id}
              nextSortOrder={nextSortOrder}
            />
          </section>
        )}
      </div>
    </div>
  );
}
