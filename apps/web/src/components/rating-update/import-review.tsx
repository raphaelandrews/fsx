import { useState } from "react";

import { Button } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { InlineAlert } from "@/components/admin/inline-alert";
import type { ImportAction, PlanRow, PlanSummary } from "@/lib/rating-import";
import type { PodiumDraft, TournamentDraft } from "@/lib/tournament-import";

const PAGE = 50;
const ACTION_LABELS: Record<ImportAction, string> = {
  rate: "Rating result",
  "create-and-rate": "New player + result",
  update: "Profile update",
  create: "New player",
};
const TYPE_LABELS = { classic: "Classic", rapid: "Rapid", blitz: "Blitz" } as const;
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

function Tile({ label, value, tone }: { label: string; value: number; tone?: "bad" }) {
  return (
    <div className={cn("rounded-2xl border p-4", tone === "bad" && value > 0 ? "border-destructive/40 bg-destructive/5" : "bg-background")}>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={cn("mt-1 font-semibold text-3xl tabular-nums", tone === "bad" && value > 0 && "text-destructive")}>{value}</p>
    </div>
  );
}

function details(entry: PlanRow, draft: TournamentDraft | null) {
  if (entry.issue) return <span className="text-destructive">{entry.issue}</span>;
  const { tournament } = entry.row;
  if (!tournament) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="tabular-nums">
      {draft ? "New tournament" : `Tournament ${tournament.tournamentId}`} · {TYPE_LABELS[tournament.ratingType]}{" "}
      <strong className={cn("font-semibold", tournament.variation >= 0 ? "text-success" : "text-destructive")}>
        {signed(tournament.variation)}
      </strong>
    </span>
  );
}

export function ImportReview({
  fileName,
  plan,
  draft = null,
  podium = [],
  summary,
  onImport,
  onCancel,
}: {
  fileName: string;
  plan: PlanRow[];
  draft?: TournamentDraft | null;
  podium?: PodiumDraft[];
  summary: PlanSummary;
  onImport: () => void;
  onCancel: () => void;
}) {
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const rows = onlyProblems ? plan.filter((entry) => entry.action === null) : plan;
  const problems = plan.filter((entry) => entry.action === null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-xl">Review before importing</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          <span className="font-medium text-foreground">{fileName}</span> has {summary.total} data row
          {summary.total === 1 ? "" : "s"}. Nothing has been saved yet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Rating results" value={summary.ratingResults} />
        <Tile label="New players" value={summary.newPlayers} />
        <Tile label="Profile updates" value={summary.profileUpdates} />
        <Tile label="Rows with problems" value={summary.problems} tone="bad" />
      </div>

      {draft ? (
        <section aria-labelledby="draft-heading" className="space-y-2 rounded-2xl border bg-background p-4">
          <h3 id="draft-heading" className="font-semibold">
            New tournament: {draft.name}
          </h3>
          <p className="text-muted-foreground text-sm">
            {TYPE_LABELS[draft.ratingType]} · tier {draft.tier} · {draft.date ? draft.date.split("-").reverse().join("/") : "no date"}
            {draft.championshipId ? ` · championship ${draft.championshipId}` : ""}. It is created first; then the results, then the
            podiums.
          </p>
          <p className="text-sm">
            <span className="font-medium tabular-nums">{podium.filter((item) => !item.error).length}</span> podium
            {podium.filter((item) => !item.error).length === 1 ? "" : "s"}
            {podium.some((item) => item.error) ? (
              <span className="text-destructive"> · {podium.filter((item) => item.error).length} with problems: {podium.filter((item) => item.error).map((item) => `row ${item.sheetRow} (${item.error})`).join("; ")}</span>
            ) : null}
          </p>
        </section>
      ) : null}

      {!draft && summary.tournamentIds.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Touches {summary.tournamentIds.length === 1 ? "tournament" : "tournaments"}{" "}
          <span className="font-medium text-foreground tabular-nums">{summary.tournamentIds.join(", ")}</span> ·{" "}
          {summary.ratingTypes.map((type) => TYPE_LABELS[type]).join(", ")}. Check that these are the tournaments you expect.
        </p>
      ) : null}

      {summary.newPlayers > 0 ? (
        <InlineAlert tone="info" title="About new players">
          Players created here start at 1900 in every format and are marked active and unverified. Without a sex value they
          are created as male.
        </InlineAlert>
      ) : null}

      {problems.length > 0 ? (
        <InlineAlert
          tone="warning"
          title={`${problems.length} row${problems.length === 1 ? "" : "s"} will be skipped`}
        >
          <ul className="list-disc pl-4">
            {problems.slice(0, 4).map((entry) => (
              <li key={entry.sheetRow}>
                Row {entry.sheetRow}: {entry.issue}
              </li>
            ))}
          </ul>
          {problems.length > 4 ? (
            <button type="button" className="mt-1 font-medium underline underline-offset-4" onClick={() => setOnlyProblems(true)}>
              Show all {problems.length}
            </button>
          ) : null}
          <p className="mt-1">Fix the file and upload it again, or import the valid rows now and retry later.</p>
        </InlineAlert>
      ) : (
        <InlineAlert tone="success" title="Every row is valid">
          The server can still reject a row, for example a player or tournament that does not exist; those are listed after
          the import.
        </InlineAlert>
      )}

      <section aria-labelledby="preview-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="preview-heading" className="font-semibold">
            Rows
          </h3>
          {problems.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant={onlyProblems ? "default" : "outline"}
              aria-pressed={onlyProblems}
              onClick={() => {
                setOnlyProblems((value) => !value);
                setShown(PAGE);
              }}
            >
              Only rows with problems ({problems.length})
            </Button>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Row</th>
                <th scope="col" className="px-3 py-2 font-medium">Player</th>
                <th scope="col" className="px-3 py-2 font-medium">What happens</th>
                <th scope="col" className="px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.slice(0, shown).map((entry) => (
                <tr key={entry.sheetRow} className={cn(entry.action === null && "bg-destructive/5")}>
                  <td className="px-3 py-2 tabular-nums">{entry.sheetRow}</td>
                  <td className="px-3 py-2">
                    {entry.row.name || (entry.row.id > 0 ? `Player ${entry.row.id}` : "—")}
                    {entry.row.id > 0 ? <span className="ml-1 text-muted-foreground tabular-nums">#{entry.row.id}</span> : null}
                  </td>
                  <td className="px-3 py-2">
                    {entry.action ? ACTION_LABELS[entry.action] : <span className="font-medium text-destructive">Skipped</span>}
                  </td>
                  <td className="px-3 py-2">{details(entry, draft)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > shown ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setShown((count) => count + PAGE)}>
            Show {Math.min(PAGE, rows.length - shown)} more ({rows.length - shown} hidden)
          </Button>
        ) : null}
      </section>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-1 py-3 backdrop-blur">
        <Button type="button" variant="outline" onClick={onCancel}>
          Choose another file
        </Button>
        <Button type="button" disabled={summary.runnable === 0} onClick={onImport}>
          {draft ? "Create the tournament and apply" : "Apply"} {summary.runnable} change{summary.runnable === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}
