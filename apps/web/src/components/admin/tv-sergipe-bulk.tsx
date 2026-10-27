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
import { getAdminErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/lib/trpc";
import {
  AGE_GROUPS,
  MODALITY_OPTIONS,
  SEX_OPTIONS,
  TEAM_NAMES,
} from "@/routes/_auth/dashboard/tv-sergipe/-constants";

type Row = { key: string; place: string; clubId: string; playerId: string; teamName: string; points: string };

const MAX_ROWS = 100;

const newRow = (place: number): Row => ({
  key: crypto.randomUUID(),
  place: String(place),
  clubId: "",
  playerId: "",
  teamName: "A",
  points: "",
});

export function TvSergipeBulkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add several results</DialogTitle>
          <DialogDescription>
            One edition, age group, sex and modality at a time. Points follow the edition’s scoring scheme unless you
            type them. Rows without a school are ignored; if one row is rejected, none are saved.
          </DialogDescription>
        </DialogHeader>
        {open ? <TvSergipeBulkForm onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function TvSergipeBulkForm({ onDone }: { onDone: () => void }) {
  const trpc = useTRPC();
  const [tournamentId, setTournamentId] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>(AGE_GROUPS[0]);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [modality, setModality] = useState<"individual" | "team">("individual");
  const [rows, setRows] = useState<Row[]>(() => [1, 2, 3].map(newRow));

  const create = useAdminMutation(trpc.tvSergipe.createMany.mutationOptions(), {
    invalidates: "tvSergipe",
    success: "Results added",
    failure: "Failed to add results",
    onSuccess: onDone,
  });

  const patch = (key: string, changes: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  const filled = rows.filter((row) => row.clubId);
  const invalid =
    !tournamentId ||
    filled.some(
      (row) =>
        !(Number(row.place) >= 1 && Number(row.place) <= 8 && Number.isInteger(Number(row.place))) ||
        (modality === "individual" && !row.playerId) ||
        (row.points !== "" && !(Number(row.points) >= 0)),
    );
  const keys = filled.map((row) => (modality === "individual" ? `p${row.playerId}` : `t${row.clubId}${row.teamName}`));
  const duplicate = new Set(keys).size !== keys.length;
  const problem = !tournamentId
    ? "Choose the edition."
    : invalid
      ? "Every row needs a place from 1 to 8 and, for individuals, a player."
      : duplicate
        ? "A player or team can appear only once per category."
        : null;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (filled.length === 0 || problem) return;
        create.mutate({
          tournamentId: Number(tournamentId),
          ageGroup: ageGroup as (typeof AGE_GROUPS)[number],
          sex,
          modality,
          results: filled.map((row) => ({
            clubId: Number(row.clubId),
            playerId: modality === "individual" ? Number(row.playerId) : null,
            teamName: modality === "team" ? (row.teamName as (typeof TEAM_NAMES)[number]) : null,
            place: Number(row.place),
            points: row.points === "" ? undefined : Number(row.points),
          })),
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="space-y-1 text-sm sm:col-span-4">
          <span className="text-muted-foreground text-xs">Edition</span>
          <SearchableSelect
            value={tournamentId}
            initialLabel=""
            onChange={setTournamentId}
            placeholder="Search tournament..."
            emptyText="No tournament found."
            getQueryOptions={(query) => trpc.tournaments.search.queryOptions({ query })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Age group</span>
          <select aria-label="Age group" className={NATIVE_SELECT_CLASS} value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
            {AGE_GROUPS.map((age) => (
              <option key={age} value={age}>
                Under {age}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Sex</span>
          <select aria-label="Sex" className={NATIVE_SELECT_CLASS} value={sex} onChange={(e) => setSex(e.target.value as "male" | "female")}>
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Modality</span>
          <select
            aria-label="Modality"
            className={NATIVE_SELECT_CLASS}
            value={modality}
            onChange={(e) => setModality(e.target.value as "individual" | "team")}
          >
            {MODALITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className="hidden grid-cols-[4.5rem_1fr_1fr_5rem_2rem] gap-2 text-xs text-muted-foreground sm:grid">
          <span>Place</span>
          <span>School</span>
          <span>{modality === "individual" ? "Player" : "Team"}</span>
          <span>Points</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div key={row.key} className="grid grid-cols-[4.5rem_1fr_2rem] gap-2 sm:grid-cols-[4.5rem_1fr_1fr_5rem_2rem]">
            <Input
              type="number"
              min={1}
              max={8}
              aria-label={`Place, row ${index + 1}`}
              value={row.place}
              onChange={(event) => patch(row.key, { place: event.target.value })}
            />
            <SearchableSelect
              value={row.clubId}
              initialLabel=""
              onChange={(value) => patch(row.key, { clubId: value })}
              placeholder="Search school..."
              emptyText="No school found."
              getQueryOptions={(query) => trpc.clubs.search.queryOptions({ query })}
            />
            {modality === "individual" ? (
              <SearchableSelect
                value={row.playerId}
                initialLabel=""
                onChange={(value) => patch(row.key, { playerId: value })}
                placeholder="Search player..."
                emptyText="No player found."
                getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
              />
            ) : (
              <select
                aria-label={`Team, row ${index + 1}`}
                className={NATIVE_SELECT_CLASS}
                value={row.teamName}
                onChange={(event) => patch(row.key, { teamName: event.target.value })}
              >
                {TEAM_NAMES.map((name) => (
                  <option key={name} value={name}>
                    Team {name}
                  </option>
                ))}
              </select>
            )}
            <Input
              type="number"
              min={0}
              aria-label={`Points, row ${index + 1}`}
              placeholder="auto"
              value={row.points}
              onChange={(event) => patch(row.key, { points: event.target.value })}
              className="hidden sm:block"
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
          onClick={() => setRows([...rows, newRow(Math.min(8, Number(rows.at(-1)?.place ?? 0) + 1))])}
        >
          Add row
        </Button>
      </div>
      {problem || create.error ? (
        <p role="alert" className="text-sm text-destructive">
          {create.error ? getAdminErrorMessage(create.error, "Failed to add results") : problem}
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
