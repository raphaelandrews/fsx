import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import type { CompetitionCategory } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@fsx/ui/components/dialog";
import { Input } from "@fsx/ui/components/input";

import {
  EntityFormDialog,
  NATIVE_SELECT_CLASS,
  type EntityField,
} from "@/components/admin/entity-form";
import { AdminSection } from "@/components/admin/form-layout";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { RowLink } from "@/components/data-table/row-link";
import { SearchableSelect } from "@/components/form/searchable-select";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CATEGORY_OPTIONS } from "@/lib/admin-forms";
import { getAdminErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/lib/trpc";

type Podium = {
  id: number;
  playerId: number;
  place: number;
  category: string | null;
  player: { id: number; name: string } | null;
};

type DraftRow = { key: string; playerId: string; playerLabel: string; place: string; category: string };

const MAX_ROWS = 50;

const newRow = (place: number): DraftRow => ({
  key: crypto.randomUUID(),
  playerId: "",
  playerLabel: "",
  place: String(place),
  category: "",
});

export function TournamentPodiums({ tournamentId }: { tournamentId: number }) {
  const trpc = useTRPC();
  const { data: podiums } = useSuspenseQuery(
    trpc.tournamentPodiums.listByTournament.queryOptions({ tournamentId }),
  );
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Podium | null>(null);

  const update = useAdminMutation(trpc.tournamentPodiums.update.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium updated",
    failure: "Failed to update podium",
    onSuccess: () => setEditing(null),
  });
  const remove = useAdminMutation(trpc.tournamentPodiums.delete.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium deleted",
    failure: "Failed to delete podium",
  });

  const editFields: EntityField[] = [
    {
      name: "playerId",
      label: "Player",
      kind: "search",
      required: true,
      placeholder: "Search player...",
      emptyText: "No player found.",
      initialLabel: editing?.player?.name,
      getQueryOptions: (query) => trpc.players.search.queryOptions({ query }),
    },
    { name: "place", label: "Place", kind: "number", required: true, min: 1, max: 100000 },
    {
      name: "category",
      label: "Category",
      kind: "select",
      options: CATEGORY_OPTIONS,
      hint: "Leave empty for the overall result.",
    },
  ];

  const columns: ColumnDef<Podium>[] = [
    { id: "category", header: "Category", cell: ({ row }) => row.original.category ?? "Overall" },
    {
      id: "place",
      header: "Place",
      cell: ({ row }) => <span className="tabular-nums">{row.original.place}º</span>,
    },
    {
      id: "player",
      header: "Player",
      cell: ({ row }) =>
        row.original.player ? (
          <RowLink to="/dashboard/players/$id" id={row.original.player.id}>
            <span className="font-semibold">{row.original.player.name}</span>
          </RowLink>
        ) : (
          "Unknown player"
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          noun="podium"
          displayName={`${row.original.player?.name ?? "Player"} (${row.original.place}º${row.original.category ? ` ${row.original.category}` : ""})`}
          onEdit={() => setEditing(row.original)}
          isDeleting={remove.isPending}
          onDelete={() => remove.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <AdminSection
      title={`Podiums (${podiums.length})`}
      description="Final places of this tournament, overall or by category."
      actions={<Button onClick={() => setBulkOpen(true)}>Add podiums</Button>}
    >
      <DataTable
        columns={columns}
        data={podiums}
        emptyState="No podiums recorded for this tournament."
        pagination={(table) => <DataTablePagination table={table} />}
      />
      <BulkPodiumsDialog tournamentId={tournamentId} open={bulkOpen} onOpenChange={setBulkOpen} />
      <EntityFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit podium"
        fields={editFields}
        defaultValues={{
          playerId: String(editing?.playerId ?? ""),
          place: String(editing?.place ?? 1),
          category: editing?.category ?? "",
        }}
        onSubmit={(values) =>
          editing &&
          update.mutate({
            id: editing.id,
            tournamentId,
            playerId: Number(values.playerId),
            place: Number(values.place),
            category: (values.category || null) as CompetitionCategory | null,
          })
        }
        error={update.error}
        pending={update.isPending}
        submitLabel="Save podium"
      />
    </AdminSection>
  );
}

function BulkPodiumsDialog({
  tournamentId,
  open,
  onOpenChange,
}: {
  tournamentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add podiums</DialogTitle>
          <DialogDescription>
            Add several places at once. Rows without a player are ignored; if one row is rejected,
            none are saved.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <BulkPodiumsForm tournamentId={tournamentId} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BulkPodiumsForm({ tournamentId, onDone }: { tournamentId: number; onDone: () => void }) {
  const trpc = useTRPC();
  const [rows, setRows] = useState<DraftRow[]>(() => [1, 2, 3].map(newRow));

  const create = useAdminMutation(trpc.tournamentPodiums.createMany.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podiums created",
    failure: "Failed to create podiums",
    onSuccess: onDone,
  });

  const patch = (key: string, changes: Partial<DraftRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  const filled = rows.filter((row) => row.playerId);
  const places = filled.map((row) => Number(row.place));
  const invalidPlace = places.some((place) => !Number.isInteger(place) || place < 1 || place > 100000);
  const keys = filled.map((row) => `${row.playerId}:${row.category}`);
  const duplicate = new Set(keys).size !== keys.length;
  const problem = invalidPlace
    ? "Every place must be a whole number from 1 to 100000."
    : duplicate
      ? "A player can appear only once per category."
      : null;

  const addRow = () => {
    const last = rows.at(-1);
    setRows([...rows, { ...newRow(Number(last?.place ?? 0) + 1), category: last?.category ?? "" }]);
  };

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (filled.length === 0 || problem) return;
        create.mutate({
          tournamentId,
          podiums: filled.map((row) => ({
            playerId: Number(row.playerId),
            place: Number(row.place),
            category: (row.category || null) as CompetitionCategory | null,
          })),
        });
      }}
    >
      <div className="space-y-2">
        <div className="hidden grid-cols-[5rem_1fr_12rem_2rem] gap-2 text-xs text-muted-foreground sm:grid">
          <span>Place</span>
          <span>Player</span>
          <span>Category</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid grid-cols-[5rem_1fr_2rem] gap-2 sm:grid-cols-[5rem_1fr_12rem_2rem]"
          >
            <Input
              type="number"
              min={1}
              max={100000}
              aria-label={`Place, row ${index + 1}`}
              value={row.place}
              onChange={(event) => patch(row.key, { place: event.target.value })}
            />
            <SearchableSelect
              value={row.playerId}
              initialLabel={row.playerLabel}
              onChange={(value) => patch(row.key, { playerId: value })}
              placeholder="Search player..."
              emptyText="No player found."
              getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
            />
            <select
              aria-label={`Category, row ${index + 1}`}
              className={`${NATIVE_SELECT_CLASS} col-span-2 sm:col-span-1`}
              value={row.category}
              onChange={(event) => patch(row.key, { category: event.target.value })}
            >
              <option value="">Overall</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove row ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
            >
              ×
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" disabled={rows.length >= MAX_ROWS} onClick={addRow}>
          Add row
        </Button>
      </div>
      {problem || create.error ? (
        <p role="alert" className="text-sm text-destructive">
          {problem ?? getAdminErrorMessage(create.error, "Failed to create podiums")}
        </p>
      ) : null}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={create.isPending || filled.length === 0 || problem !== null}>
          {create.isPending ? "Saving..." : `Create ${filled.length} podium${filled.length === 1 ? "" : "s"}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
