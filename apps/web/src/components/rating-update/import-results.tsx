import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { InlineAlert } from "@/components/admin/inline-alert";
import { maintenanceNotes, type MaintenanceResult } from "@/lib/rating-import-feedback";
import { failuresToCsv, type ImportResult } from "@/lib/rating-import-report";

const PAGE = 25;

function Counter({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={cn("mt-1 font-semibold text-3xl tabular-nums", tone === "good" && value > 0 && "text-success", tone === "bad" && value > 0 && "text-destructive")}>
        {value}
      </p>
    </div>
  );
}

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportResults({
  fileName,
  results,
  notRun,
  retryable,
  maintenance,
  snapshotError,
  restored,
  onResume,
  onReset,
}: {
  fileName: string;
  results: ImportResult[];
  /** Planned rows that never ran because the import was stopped. */
  notRun: number;
  /** Failed or unrun rows can be tried again (the plan is still in memory). */
  retryable: number;
  maintenance: MaintenanceResult | null;
  snapshotError: string | null;
  restored: boolean;
  onResume: () => void;
  onReset: () => void;
}) {
  const applied = useMemo(() => results.filter((result) => result.status === "applied"), [results]);
  const failed = useMemo(() => results.filter((result) => result.status !== "applied"), [results]);
  const failedCount = failed.filter((result) => result.status === "failed").length;
  const skippedCount = failed.length - failedCount;
  const [tab, setTab] = useState<"attention" | "applied">(failed.length > 0 ? "attention" : "applied");
  const [shown, setShown] = useState(PAGE);
  const list = (tab === "attention" ? failed : applied).slice().sort((a, b) => a.sheetRow - b.sheetRow);
  const notes = maintenance ? maintenanceNotes(maintenance) : [];

  const tone = failed.length === 0 && notRun === 0 ? "success" : applied.length === 0 ? "error" : "warning";
  const title =
    tone === "success"
      ? `All ${applied.length} change${applied.length === 1 ? "" : "s"} were applied`
      : tone === "error"
        ? "Nothing was applied"
        : `${applied.length} applied, ${failed.length + notRun} need attention`;

  return (
    <div className="space-y-6">
      <InlineAlert tone={tone} title={title}>
        {restored ? "Report from your last import" : "Import finished"} · {fileName}.
        {notRun > 0 ? ` The import was stopped before ${notRun} row${notRun === 1 ? "" : "s"} ran.` : ""}
      </InlineAlert>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Counter label="Applied" value={applied.length} tone="good" />
        <Counter label="Failed" value={failedCount} tone="bad" />
        <Counter label="Skipped (invalid)" value={skippedCount} />
        <Counter label="Not run" value={notRun} />
      </div>

      {snapshotError ? (
        <InlineAlert tone="error" title="Ranking snapshot failed">
          {snapshotError}
        </InlineAlert>
      ) : null}
      {notes.map((note) => (
        <InlineAlert key={note.text} tone={note.tone} title={note.tone === "warning" ? "Needs a look" : "Maintenance"}>
          {note.text}
        </InlineAlert>
      ))}

      <section aria-labelledby="results-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="results-heading" className="font-semibold text-lg">
            Rows
          </h2>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={tab === "attention" ? "default" : "outline"} aria-pressed={tab === "attention"} onClick={() => { setTab("attention"); setShown(PAGE); }}>
              Needs attention ({failed.length})
            </Button>
            <Button type="button" size="sm" variant={tab === "applied" ? "default" : "outline"} aria-pressed={tab === "applied"} onClick={() => { setTab("applied"); setShown(PAGE); }}>
              Applied ({applied.length})
            </Button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground text-sm">
            {tab === "attention" ? "No row failed." : "No row was applied."}
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-background">
            {list.slice(0, shown).map((result) => (
              <li key={result.sheetRow} className="flex gap-3 px-4 py-3 text-sm">
                <span className="w-20 shrink-0 text-muted-foreground tabular-nums">{result.where ?? `Row ${result.sheetRow}`}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{result.title}</p>
                  <p className={cn(tab === "attention" ? "text-destructive" : "text-muted-foreground")}>{result.summary}</p>
                  {result.detail ? <p className="mt-0.5 text-muted-foreground text-pretty">{result.detail}</p> : null}
                  {result.input ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-muted-foreground text-xs">Row as typed in the file</summary>
                      <code className="mt-1 block break-words rounded-md bg-muted px-2 py-1 text-xs">{result.input}</code>
                    </details>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {list.length > shown ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setShown((count) => count + PAGE)}>
            Show {Math.min(PAGE, list.length - shown)} more ({list.length - shown} hidden)
          </Button>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        {failed.length > 0 ? (
          <Button type="button" variant="outline" onClick={() => download(`rating-update-problems-${new Date().toISOString().slice(0, 10)}.csv`, failuresToCsv(results))}>
            <HugeiconsIcon icon={Download01Icon} data-icon="inline-start" aria-hidden />
            Download problems (CSV)
          </Button>
        ) : null}
        {retryable > 0 ? (
          <Button type="button" variant="outline" onClick={onResume}>
            Retry {retryable} row{retryable === 1 ? "" : "s"}
          </Button>
        ) : null}
        <Button type="button" onClick={onReset}>
          Import another file
        </Button>
      </div>
    </div>
  );
}
