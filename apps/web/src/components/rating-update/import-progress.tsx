import { useState } from "react";

import { Button } from "@fsx/ui/components/button";

import type { ImportResult } from "@/lib/rating-import-report";

export function ImportProgress({
  progress,
  results,
  onStop,
}: {
  progress: { done: number; total: number; current: string };
  results: ImportResult[];
  onStop: () => void;
}) {
  const [stopping, setStopping] = useState(false);
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const applied = results.filter((result) => result.status === "applied").length;
  const failed = results.filter((result) => result.status === "failed").length;
  // Screen readers hear every tenth of the run, not every row.
  const milestone = Math.floor(percent / 10) * 10;

  return (
    <div className="space-y-5 rounded-2xl border bg-background p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-xl">{stopping ? "Stopping after this row…" : "Importing…"}</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Keep this tab open. Rows are applied one at a time, and each one is saved as soon as it succeeds.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={stopping}
          onClick={() => {
            setStopping(true);
            onStop();
          }}
        >
          Stop
        </Button>
      </div>

      <div className="space-y-2">
        <div
          role="progressbar"
          aria-label="Import progress"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          className="h-3 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium tabular-nums">
            {progress.done} of {progress.total} rows · {percent}%
          </span>
          <span className="text-muted-foreground tabular-nums">
            <span className="text-success">{applied} applied</span> ·{" "}
            <span className={failed > 0 ? "text-destructive" : undefined}>{failed} failed</span>
          </span>
        </div>
        {progress.current ? <p className="truncate text-muted-foreground text-sm">Now: {progress.current}</p> : null}
      </div>

      <p role="status" className="sr-only">
        {milestone}% of the import is done.
      </p>
    </div>
  );
}
