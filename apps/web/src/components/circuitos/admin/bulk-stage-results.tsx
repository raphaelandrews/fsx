import { useState } from "react";

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

import { NATIVE_SELECT_CLASS } from "@/components/admin/entity-form";
import { SearchableSelect } from "@/components/form/searchable-select";
import { useAdminMutation } from "@/lib/admin-mutations";
import { circuitCategoryOptions, useCategoryOptions } from "@/lib/reference-options";
import { getAdminErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/lib/trpc";

type Row = { key: string; playerId: string; place: string; points: string; pointsEdited: boolean };

export type SchemePoints = { name: string; places: { place: number; points: number }[] };

const MAX_ROWS = 50;
const DEFAULT_ROWS = 3;

const suggestedPoints = (place: number, scheme: SchemePoints | null) => {
  const points = scheme?.places.find((entry) => entry.place === place)?.points;
  return points === undefined ? "" : String(points);
};

const newRow = (place: number, scheme: SchemePoints | null): Row => ({
  key: crypto.randomUUID(),
  playerId: "",
  place: String(place),
  points: suggestedPoints(place, scheme),
  pointsEdited: false,
});

export function BulkStageResultsDialog({
  circuitPhaseId,
  scheme,
  categories,
  open,
  onOpenChange,
}: {
  circuitPhaseId: number;
  scheme: SchemePoints | null;
  categories: readonly { category: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add stage results</DialogTitle>
          <DialogDescription>
            One category at a time. {scheme ? `Points are prefilled from “${scheme.name}” but can be changed, so tied players can share points. ` : ""}
            Rows without a player are ignored; if one row is rejected, none are saved.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <BulkStageResultsForm circuitPhaseId={circuitPhaseId} scheme={scheme} categories={categories} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BulkStageResultsForm({
  circuitPhaseId,
  scheme,
  categories,
  onDone,
}: {
  circuitPhaseId: number;
  scheme: SchemePoints | null;
  categories: readonly { category: string }[];
  onDone: () => void;
}) {
  const trpc = useTRPC();
  const categoryOptions = circuitCategoryOptions(useCategoryOptions(), categories);
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: Math.min(MAX_ROWS, scheme?.places.length ?? DEFAULT_ROWS) }, (_, index) => newRow(index + 1, scheme)),
  );

  const create = useAdminMutation(trpc.circuits.results.createMany.mutationOptions(), {
    invalidates: "circuits",
    success: "Results added",
    failure: "Failed to add results",
    onSuccess: onDone,
  });

  const patch = (key: string, changes: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  const changePlace = (row: Row, value: string) =>
    patch(row.key, {
      place: value,
      ...(row.pointsEdited ? {} : { points: suggestedPoints(Number(value), scheme) }),
    });

  const filled = rows.filter((row) => row.playerId);
  const invalid = filled.some(
    (row) =>
      (row.place !== "" && (!Number.isInteger(Number(row.place)) || Number(row.place) < 1 || Number(row.place) > 1000)) ||
      row.points === "" ||
      !(Number(row.points) >= 0),
  );
  const duplicate = new Set(filled.map((row) => row.playerId)).size !== filled.length;
  const problem = invalid
    ? "Every row needs points, and a place from 1 to 1000 when set."
    : duplicate
      ? "A player can appear only once per category."
      : null;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (filled.length === 0 || problem) return;
        create.mutate({
          circuitPhaseId,
          category: category || null,
          results: filled.map((row) => ({
            playerId: Number(row.playerId),
            place: row.place === "" ? null : Number(row.place),
            points: Number(row.points),
          })),
        });
      }}
    >
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground text-xs">Category</span>
        <select
          aria-label="Category"
          className={NATIVE_SELECT_CLASS}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">No category</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-2">
        <div className="hidden grid-cols-[5rem_1fr_6rem_2rem] gap-2 text-xs text-muted-foreground sm:grid">
          <span>Place</span>
          <span>Player</span>
          <span>Points</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div key={row.key} className="grid grid-cols-[5rem_1fr_6rem_2rem] gap-2">
            <Input
              type="number"
              min={1}
              max={1000}
              aria-label={`Place, row ${index + 1}`}
              value={row.place}
              onChange={(event) => changePlace(row, event.target.value)}
            />
            <SearchableSelect
              value={row.playerId}
              initialLabel=""
              onChange={(value) => patch(row.key, { playerId: value })}
              placeholder="Search player..."
              emptyText="No player found."
              getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
            />
            <Input
              type="number"
              min={0}
              aria-label={`Points, row ${index + 1}`}
              value={row.points}
              onChange={(event) => patch(row.key, { points: event.target.value, pointsEdited: true })}
            />
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
        <Button
          type="button"
          variant="outline"
          disabled={rows.length >= MAX_ROWS}
          onClick={() => setRows([...rows, newRow(Number(rows.at(-1)?.place ?? 0) + 1, scheme)])}
        >
          Add row
        </Button>
      </div>
      {problem || create.error ? (
        <p role="alert" className="text-sm text-destructive">
          {problem ?? getAdminErrorMessage(create.error, "Failed to add results")}
        </p>
      ) : null}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" loading={create.isPending} disabled={filled.length === 0 || problem !== null}>
          {create.isPending ? "Saving..." : `Add ${filled.length} result${filled.length === 1 ? "" : "s"}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
