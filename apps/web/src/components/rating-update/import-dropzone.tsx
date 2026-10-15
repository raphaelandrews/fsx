import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, FileUploadIcon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { InlineAlert } from "@/components/admin/inline-alert";
import { downloadImportTemplate, downloadTournamentTemplate, IMPORT_COLUMNS } from "@/lib/rating-import-file";

export function ImportDropzone({
  onFile,
  reading,
  error,
}: {
  onFile: (file: File) => void;
  reading: boolean;
  error: string | null;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-4">
      {error ? (
        <InlineAlert tone="error" title="This file cannot be imported">
          {error}
        </InlineAlert>
      ) : null}

      <label
        htmlFor="rating-file"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
          reading && "pointer-events-none opacity-60",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon icon={FileUploadIcon} className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="font-semibold text-lg">{reading ? "Reading the file…" : "Drop a Swiss Manager export here"}</span>
        <span className="text-muted-foreground text-sm">
          or <span className="font-medium text-primary underline underline-offset-4">choose a file</span> · .xlsx or .xls, up to 5 MB
        </span>
        <span className="text-muted-foreground text-sm">Nothing is saved until you review it in the next step.</span>
        <input
          id="rating-file"
          type="file"
          className="sr-only"
          accept=".xlsx,.xls"
          disabled={reading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFile(file);
          }}
        />
      </label>

      <details className="rounded-xl border bg-background">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 font-medium text-sm">
          What columns does the file need?
        </summary>
        <div className="space-y-3 border-t px-4 py-4">
          <p className="text-muted-foreground text-sm">
            The first row holds the column names. Use <strong className="font-medium text-foreground">id</strong> plus either
            player data, a complete tournament result, or both.
          </p>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            {IMPORT_COLUMNS.map((column) => (
              <div key={column.name} className="contents">
                <dt className="font-mono font-medium">
                  {column.name}
                  {"required" in column ? <span className="ml-1 text-destructive">*</span> : null}
                </dt>
                <dd className="text-muted-foreground">{column.help}</dd>
              </div>
            ))}
          </dl>
          <Button type="button" variant="outline" size="sm" onClick={() => void downloadImportTemplate()}>
            <HugeiconsIcon icon={Download01Icon} data-icon="inline-start" aria-hidden />
            Download a template
          </Button>
        </div>
      </details>

      <details className="rounded-xl border bg-background">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 font-medium text-sm">
          Importing a whole new tournament from one file
        </summary>
        <div className="space-y-3 border-t px-4 py-4 text-sm">
          <p className="text-muted-foreground">
            A workbook with a <strong className="font-medium text-foreground">Tournament</strong> sheet creates the tournament,
            then applies the <strong className="font-medium text-foreground">Results</strong> sheet, then adds the optional{" "}
            <strong className="font-medium text-foreground">Podium</strong> sheet.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Tournament: two columns, field and value: <span className="font-mono">name</span>,{" "}
              <span className="font-mono">ratingType</span> (required), <span className="font-mono">date</span>,{" "}
              <span className="font-mono">tier</span>, <span className="font-mono">championshipId</span>,{" "}
              <span className="font-mono">chessResults</span>.
            </li>
            <li>Results: the columns above without tournamentId and ratingType, which come from the Tournament sheet.</li>
            <li>
              Podium: <span className="font-mono">place</span>, <span className="font-mono">category</span> (optional), and either{" "}
              <span className="font-mono">playerId</span> or <span className="font-mono">row</span>, the Results row of a player
              the import creates.
            </li>
          </ul>
          <Button type="button" variant="outline" size="sm" onClick={() => void downloadTournamentTemplate()}>
            <HugeiconsIcon icon={Download01Icon} data-icon="inline-start" aria-hidden />
            Download the tournament template
          </Button>
        </div>
      </details>
    </div>
  );
}
