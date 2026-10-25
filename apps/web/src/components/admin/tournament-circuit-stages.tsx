import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { EntityFormDialog, type EntityField } from "@/components/admin/entity-form";
import { AdminSection } from "@/components/admin/form-layout";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { RowLink } from "@/components/data-table/row-link";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";

type Stage = { id: number; sortOrder: number; circuit: { id: number; name: string; year: number | null } };

export function TournamentCircuitStages({ tournamentId }: { tournamentId: number }) {
  const trpc = useTRPC();
  const [adding, setAdding] = useState(false);
  const { data: stages } = useSuspenseQuery(trpc.circuits.phases.listByTournament.queryOptions({ tournamentId }));
  const { data: circuits = [] } = useQuery({ ...trpc.circuits.listSimple.queryOptions(), enabled: adding });

  const create = useAdminMutation(trpc.circuits.phases.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Added to circuit",
    failure: "Failed to add to circuit",
    onSuccess: () => setAdding(false),
  });
  const remove = useAdminMutation(trpc.circuits.phases.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Removed from circuit",
    failure: "Failed to remove from circuit",
  });

  const fields: EntityField[] = [
    {
      name: "circuitId",
      label: "Circuit",
      kind: "select",
      required: true,
      options: circuits.map((circuit) => ({ value: String(circuit.id), label: `${circuit.name} (${circuit.year})` })),
    },
    {
      name: "sortOrder",
      label: "Stage order",
      kind: "number",
      required: true,
      min: 0,
      max: 100_000,
      hint: "Stages are shown in this order.",
    },
  ];

  const columns: ColumnDef<Stage>[] = [
    {
      id: "circuit",
      header: "Circuit",
      cell: ({ row }) => (
        <RowLink to="/dashboard/circuits/$id" id={row.original.circuit.id}>
          <span className="font-semibold">{row.original.circuit.name}</span>
        </RowLink>
      ),
    },
    { id: "year", header: "Season", cell: ({ row }) => <span className="tabular-nums">{row.original.circuit.year ?? "—"}</span> },
    { id: "order", header: "Stage", cell: ({ row }) => <span className="tabular-nums">{row.original.sortOrder}</span> },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          noun="circuit stage"
          displayName={`${row.original.circuit.name} · stage ${row.original.sortOrder}`}
          isDeleting={remove.isPending}
          onDelete={() => remove.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <AdminSection
      title={`Circuit stages (${stages.length})`}
      description="Circuits this tournament is a stage of. Results entered on the circuit page use it."
      actions={<Button onClick={() => setAdding(true)}>Add to circuit</Button>}
    >
      <DataTable columns={columns} data={stages} emptyState="This tournament is not part of any circuit." />
      <EntityFormDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add to circuit"
        fields={fields}
        defaultValues={{ circuitId: "", sortOrder: "1" }}
        onSubmit={(values) =>
          create.mutate({ circuitId: Number(values.circuitId), tournamentId, sortOrder: Number(values.sortOrder) })
        }
        error={create.error}
        pending={create.isPending}
        submitLabel="Add to circuit"
      />
    </AdminSection>
  );
}
