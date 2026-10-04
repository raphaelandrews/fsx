import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { CompetitionCategory } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";

import { EntityFormDialog, optionalNumber, type EntityField } from "@/components/admin/entity-form";
import { AdminSection } from "@/components/admin/form-layout";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CATEGORY_OPTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

import type { Circuit, CircuitPhase, CircuitPodium } from "../types";

type PodiumTarget = { circuitId: number } | { circuitPhaseId: number };
type EditingPodium = { target: PodiumTarget; podium?: CircuitPodium } | null;
type EditingPhase = { phase?: CircuitPhase } | null;

const podiumPlace = (podium: CircuitPodium) => podium.place ?? Number.MAX_SAFE_INTEGER;
const byPlaceThenPoints = (a: CircuitPodium, b: CircuitPodium) =>
  podiumPlace(a) - podiumPlace(b) || (b.points ?? 0) - (a.points ?? 0) || a.id - b.id;

export function CircuitEditor({ circuit }: { circuit: Circuit }) {
  const trpc = useTRPC();
  const [editingPodium, setEditingPodium] = useState<EditingPodium>(null);
  const [editingPhase, setEditingPhase] = useState<EditingPhase>(null);

  const createPodium = useAdminMutation(trpc.circuits.podiums.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Result added",
    failure: "Failed to add result",
    onSuccess: () => setEditingPodium(null),
  });
  const updatePodium = useAdminMutation(trpc.circuits.podiums.update.mutationOptions(), {
    invalidates: "circuits",
    success: "Result updated",
    failure: "Failed to update result",
    reloadOnConflict: true,
    onSuccess: () => setEditingPodium(null),
  });
  const deletePodium = useAdminMutation(trpc.circuits.podiums.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Result deleted",
    failure: "Failed to delete result",
  });
  const createPhase = useAdminMutation(trpc.circuits.phases.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Stage added",
    failure: "Failed to add stage",
    onSuccess: () => setEditingPhase(null),
  });
  const updatePhase = useAdminMutation(trpc.circuits.phases.update.mutationOptions(), {
    invalidates: "circuits",
    success: "Stage updated",
    failure: "Failed to update stage",
    reloadOnConflict: true,
    onSuccess: () => setEditingPhase(null),
  });
  const deletePhase = useAdminMutation(trpc.circuits.phases.delete.mutationOptions(), {
    invalidates: "circuits",
    success: "Stage deleted",
    failure: "Failed to delete stage",
  });

  const phases = [...circuit.circuitPhases].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );
  const nextSortOrder = phases.reduce((max, phase) => Math.max(max, phase.sortOrder), 0) + 1;
  const podiumMutation = editingPodium?.podium ? updatePodium : createPodium;
  const phaseMutation = editingPhase?.phase ? updatePhase : createPhase;

  const podiumFields: EntityField[] = [
    {
      name: "playerId",
      label: "Player",
      kind: "search",
      required: true,
      placeholder: "Search player...",
      emptyText: "No player found.",
      initialLabel: editingPodium?.podium?.player?.name,
      getQueryOptions: (query) => trpc.players.search.queryOptions({ query }),
    },
    { name: "place", label: "Stage place", kind: "number", min: 1, max: 1000 },
    { name: "points", label: "Points", kind: "number", required: true, min: 0, max: 1_000_000 },
    {
      name: "category",
      label: "Category",
      kind: "select",
      options: CATEGORY_OPTIONS,
    },
  ];

  const phaseFields: EntityField[] = [
    {
      name: "tournamentId",
      label: "Tournament",
      kind: "search",
      required: true,
      placeholder: "Search tournament...",
      emptyText: "No tournament found.",
      initialLabel: editingPhase?.phase?.tournament?.name,
      getQueryOptions: (query) => trpc.tournaments.search.queryOptions({ query }),
    },
    {
      name: "clubId",
      label: "Host club",
      kind: "search",
      placeholder: "Search club...",
      emptyText: "No club found.",
      initialLabel: editingPhase?.phase?.club?.name,
      getQueryOptions: (query) => trpc.clubs.search.queryOptions({ query }),
    },
    {
      name: "sortOrder",
      label: "Order",
      kind: "number",
      required: true,
      min: 0,
      hint: "Stages are shown in this order.",
    },
  ];

  const podiumTable = (podiums: CircuitPodium[], target: PodiumTarget) => {
    const columns: ColumnDef<CircuitPodium>[] = [
      {
        id: "place",
        header: "Place",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.place ? `${row.original.place}º` : "—"}
          </span>
        ),
      },
      {
        id: "player",
        header: "Player",
        cell: ({ row }) => <span className="font-medium">{row.original.player?.name ?? "—"}</span>,
      },
      { id: "category", header: "Category", cell: ({ row }) => row.original.category ?? "—" },
      {
        id: "points",
        header: () => <span className="block text-right">Points</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{row.original.points}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DataTableRowActions
            id={row.original.id}
            noun="result"
            displayName={`${row.original.player?.name ?? "Player"} (${row.original.points} pts)`}
            onEdit={() => setEditingPodium({ target, podium: row.original })}
            isDeleting={deletePodium.isPending}
            onDelete={() => deletePodium.mutate({ id: row.original.id })}
          />
        ),
      },
    ];
    return (
      <DataTable
        columns={columns}
        data={[...podiums].sort(byPlaceThenPoints)}
        emptyState="No results yet."
        pagination={(table) => <DataTablePagination table={table} />}
      />
    );
  };

  return (
    <>
      {circuit.type === "geral" ? (
        <AdminSection
          title="Overall standings"
          description="This circuit has no stages: each row is a player's points in the season ranking."
          actions={
            <Button onClick={() => setEditingPodium({ target: { circuitId: circuit.id } })}>
              Add result
            </Button>
          }
        >
          {podiumTable(circuit.circuitPodiums, { circuitId: circuit.id })}
        </AdminSection>
      ) : (
        <AdminSection
          title="Stages"
          description="Each stage is played at a tournament. Its results are the points each player scored there; the standings add them up."
          actions={<Button onClick={() => setEditingPhase({})}>Add stage</Button>}
        >
          {phases.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No stages yet.</p>
          ) : (
            <div className="space-y-10">
              {phases.map((phase) => (
                <div key={phase.id}>
                  <div className="mb-3 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-medium">
                        Stage {phase.sortOrder} · {phase.tournament?.name ?? "Tournament"}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {phase.club?.name ? `Hosted by ${phase.club.name} · ` : ""}
                        {phase.circuitPodiums.length} result(s)
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPodium({ target: { circuitPhaseId: phase.id } })}
                      >
                        Add result
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPhase({ phase })}
                      >
                        Edit stage
                      </Button>
                      <ConfirmDeleteButton
                        label="Delete stage"
                        title="Delete this stage?"
                        itemName={`Stage ${phase.sortOrder} · ${phase.tournament?.name ?? ""}`}
                        description={`The stage and its ${phase.circuitPodiums.length} result(s) will be permanently deleted. This cannot be undone.`}
                        pending={deletePhase.isPending}
                        onConfirm={() => deletePhase.mutate({ id: phase.id })}
                      />
                    </div>
                  </div>
                  {podiumTable(phase.circuitPodiums, { circuitPhaseId: phase.id })}
                </div>
              ))}
            </div>
          )}
        </AdminSection>
      )}

      <EntityFormDialog
        open={editingPodium !== null}
        onOpenChange={(open) => !open && setEditingPodium(null)}
        title={editingPodium?.podium ? "Edit result" : "Add result"}
        fields={podiumFields}
        defaultValues={{
          playerId: editingPodium?.podium ? String(editingPodium.podium.playerId) : "",
          place: editingPodium?.podium?.place ? String(editingPodium.podium.place) : "",
          points: editingPodium?.podium ? String(editingPodium.podium.points) : "",
          category: editingPodium?.podium?.category ?? "",
        }}
        onSubmit={(values) => {
          if (!editingPodium) return;
          const payload = {
            ...editingPodium.target,
            playerId: Number(values.playerId),
            place: optionalNumber(values.place!),
            points: Number(values.points),
            category: (values.category || null) as CompetitionCategory | null,
          };
          if (editingPodium.podium)
            updatePodium.mutate({ id: editingPodium.podium.id, ...payload });
          else createPodium.mutate(payload);
        }}
        error={podiumMutation.error}
        pending={podiumMutation.isPending}
        submitLabel={editingPodium?.podium ? "Save result" : "Add result"}
      />

      <EntityFormDialog
        open={editingPhase !== null}
        onOpenChange={(open) => !open && setEditingPhase(null)}
        title={editingPhase?.phase ? "Edit stage" : "Add stage"}
        fields={phaseFields}
        defaultValues={{
          tournamentId: editingPhase?.phase ? String(editingPhase.phase.tournamentId) : "",
          clubId: editingPhase?.phase?.clubId ? String(editingPhase.phase.clubId) : "",
          sortOrder: String(editingPhase?.phase?.sortOrder ?? nextSortOrder),
        }}
        onSubmit={(values) => {
          const payload = {
            circuitId: circuit.id,
            tournamentId: Number(values.tournamentId),
            clubId: optionalNumber(values.clubId!),
            sortOrder: Number(values.sortOrder),
          };
          if (editingPhase?.phase) updatePhase.mutate({ id: editingPhase.phase.id, ...payload });
          else createPhase.mutate(payload);
        }}
        error={phaseMutation.error}
        pending={phaseMutation.isPending}
        submitLabel={editingPhase?.phase ? "Save stage" : "Add stage"}
      />
    </>
  );
}
