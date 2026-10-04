import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { CIRCUIT_TYPES_BY_CATEGORY, type CompetitionCategory } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";

import { EntityFormDialog, optionalNumber, type EntityField } from "@/components/admin/entity-form";
import { AdminSection } from "@/components/admin/form-layout";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CATEGORY_OPTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

import type { Circuit } from "../types";

type FinalPodium = Circuit["circuitFinalPodiums"][number];
type Editing = { podium?: FinalPodium } | null;

const todayInSergipe = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export function CircuitFinalPodiums({ circuit }: { circuit: Circuit }) {
  const trpc = useTRPC();
  const [finishing, setFinishing] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);

  const finish = useAdminMutation(trpc.circuits.finish.mutationOptions(), {
    invalidates: "circuits",
    success: "Season finished. Review the final podiums below.",
    failure: "Failed to finish the season",
    reloadOnConflict: true,
    onSuccess: () => setFinishing(null),
  });
  const reopen = useAdminMutation(trpc.circuits.reopen.mutationOptions(), {
    invalidates: "circuits",
    success: "Season reopened",
    failure: "Failed to reopen the season",
  });
  const create = useAdminMutation(trpc.circuits.finalPodiums.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Final podium added",
    failure: "Failed to add final podium",
    onSuccess: () => setEditing(null),
  });
  const update = useAdminMutation(trpc.circuits.finalPodiums.update.mutationOptions(), {
    invalidates: "circuits",
    success: "Final podium updated",
    failure: "Failed to update final podium",
    reloadOnConflict: true,
    onSuccess: () => setEditing(null),
  });
  const remove = useAdminMutation(trpc.circuits.finalPodiums.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Final podium deleted",
    failure: "Failed to delete final podium",
  });

  const byCategory = (CIRCUIT_TYPES_BY_CATEGORY as readonly string[]).includes(circuit.type);
  const podiumMutation = editing?.podium ? update : create;
  const podiums = circuit.circuitFinalPodiums;

  const fields: EntityField[] = [
    {
      name: "playerId",
      label: "Player",
      kind: "search",
      required: true,
      placeholder: "Search player...",
      emptyText: "No player found.",
      initialLabel: editing?.podium?.player?.name,
      getQueryOptions: (query) => trpc.players.search.queryOptions({ query }),
    },
    {
      name: "category",
      label: "Category",
      kind: "select",
      options: CATEGORY_OPTIONS,
      hint: "Leave empty for the overall ranking.",
    },
    { name: "place", label: "Place", kind: "number", required: true, min: 1, max: 1000 },
    { name: "points", label: "Points", kind: "number", min: 0, max: 1_000_000 },
  ];

  const columns: ColumnDef<FinalPodium>[] = [
    { id: "category", header: "Category", cell: ({ row }) => row.original.category ?? "Overall" },
    {
      id: "place",
      header: "Place",
      cell: ({ row }) => <span className="tabular-nums">{row.original.place}º</span>,
    },
    {
      id: "player",
      header: "Player",
      cell: ({ row }) => <span className="font-medium">{row.original.player?.name ?? "—"}</span>,
    },
    {
      id: "points",
      header: () => <span className="block text-right">Points</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">{row.original.points ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          noun="final podium"
          displayName={`${row.original.player?.name ?? "Player"} (${row.original.place}º${row.original.category ? ` ${row.original.category}` : ""})`}
          onEdit={() => setEditing({ podium: row.original })}
          isDeleting={remove.isPending}
          onDelete={() => remove.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <>
      {circuit.finishedAt ? (
        <AdminSection
          title="Final podiums"
          description={`Season finished on ${circuit.finishedAt}. These placings are the official record and stay even if stage points change.`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditing({})}>
                Add final podium
              </Button>
              <ConfirmDeleteButton
                label="Reopen season"
                title="Reopen this season?"
                itemName={circuit.name}
                description={`Its ${podiums.length} final podium(s) will be deleted and the season will be in progress again. Finishing it again recomputes them from the stage points.`}
                pending={reopen.isPending}
                onConfirm={() => reopen.mutate({ id: circuit.id })}
              />
            </div>
          }
        >
          <DataTable columns={columns} data={podiums} emptyState="No final podiums." />
        </AdminSection>
      ) : (
        <AdminSection
          title="Final podiums"
          description={`When the season ends, finish it: the top 3 of the current standings${byCategory ? " in each category" : ""} become its final podiums, with shared places for equal points. You can correct them afterwards.`}
          actions={
            <Button onClick={() => setFinishing(todayInSergipe())}>
              Finish season
            </Button>
          }
        >
          <p className="py-6 text-center text-muted-foreground text-sm">The season is in progress.</p>
        </AdminSection>
      )}

      <EntityFormDialog
        open={finishing !== null}
        onOpenChange={(open) => !open && setFinishing(null)}
        title="Finish season"
        fields={[{ name: "finishedAt", label: "Finished on", kind: "date", required: true }]}
        defaultValues={{ finishedAt: finishing ?? "" }}
        onSubmit={(values) => finish.mutate({ id: circuit.id, finishedAt: values.finishedAt! })}
        error={finish.error}
        pending={finish.isPending}
        submitLabel="Finish season"
      />

      <EntityFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.podium ? "Edit final podium" : "Add final podium"}
        fields={fields}
        defaultValues={{
          playerId: editing?.podium ? String(editing.podium.playerId) : "",
          category: editing?.podium?.category ?? "",
          place: editing?.podium ? String(editing.podium.place) : "1",
          points: editing?.podium?.points != null ? String(editing.podium.points) : "",
        }}
        onSubmit={(values) => {
          const payload = {
            playerId: Number(values.playerId),
            category: (values.category || null) as CompetitionCategory | null,
            place: Number(values.place),
            points: optionalNumber(values.points!),
          };
          if (editing?.podium) update.mutate({ id: editing.podium.id, ...payload });
          else create.mutate({ circuitId: circuit.id, ...payload });
        }}
        error={podiumMutation.error}
        pending={podiumMutation.isPending}
        submitLabel={editing?.podium ? "Save final podium" : "Add final podium"}
      />
    </>
  );
}
