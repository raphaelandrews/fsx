import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard/backup/")({
  head: () => ({ meta: [{ title: "Backup - Admin - FSX" }] }),
  component: RouteComponent,
});

const DATABASE_NAME = "fsx-database-raphael";
const BACKUP_CMD = "bun run db:backup";
const RESTORE_CMD = `cd apps/web
npx wrangler d1 execute ${DATABASE_NAME} --remote --file="$HOME/Backups/fsx-2026-09-30-153045/fsx-2026-09-30-153045.sql"`;

function Code({ children }: { children: string }) {
  return (
    <code className="mt-1 block overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
      {children}
    </code>
  );
}

function RouteComponent() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-bold text-2xl">Backup</h1>

      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Full backup (SQL + CSV)</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          One command exports the entire remote database into a timestamped folder under{" "}
          <code className="rounded bg-muted px-1 py-0.5">~/Backups</code>, as a full SQL dump plus
          one CSV per table. Nothing is written inside this repository.
        </p>
        <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            Log in to Cloudflare once, if needed:{" "}
            <code className="rounded bg-muted px-1 py-0.5">npx wrangler login</code>.
          </li>
          <li>Run it from the project root:</li>
        </ol>
        <Code>{BACKUP_CMD}</Code>
        <p className="mt-3 mb-1 text-muted-foreground text-sm">It creates a folder per run:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1 py-0.5">
              ~/Backups/fsx-2026-09-30-153045/fsx-2026-09-30-153045.sql
            </code>{" "}
            — full dump (schema + data)
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5">
              ~/Backups/fsx-2026-09-30-153045/csv/&lt;table&gt;.csv
            </code>{" "}
            — one CSV per table
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground text-xs">
          Requires <code className="rounded bg-muted px-1 py-0.5">sqlite3</code> on your PATH. The
          database is briefly blocked while the export runs. The script lives at{" "}
          <code className="rounded bg-muted px-1 py-0.5">scripts/d1-backup.sh</code>.
        </p>
      </div>

      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Restore a backup</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Import a previously exported <code className="rounded bg-muted px-1 py-0.5">.sql</code>{" "}
          file back into the remote database (replace the path with your actual backup):
        </p>
        <Code>{RESTORE_CMD}</Code>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Cloudflare Dashboard</h2>
        <p className="mb-2 text-muted-foreground text-sm">
          The dashboard does not offer a downloadable full backup for production D1 databases. Use
          it to browse the database, not to save a copy:
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            Open the <span className="text-foreground">D1 SQL database</span> page (search for it;
            in the older UI it is Workers &amp; Pages &rarr; D1).
          </li>
          <li>
            Select <code className="rounded bg-muted px-1 py-0.5">{DATABASE_NAME}</code>.
          </li>
          <li>
            Use the <span className="text-foreground">Console</span> to run queries and the{" "}
            <span className="text-foreground">Time Travel</span> tab for point-in-time{" "}
            <em>restore</em> (not a file download).
          </li>
        </ol>
        <p className="mt-3 text-muted-foreground text-xs">
          Docs:{" "}
          <a
            className="text-foreground underline underline-offset-2"
            href="https://developers.cloudflare.com/d1/best-practices/import-export-data/"
            rel="noreferrer"
            target="_blank"
          >
            Import and export data
          </a>
        </p>
      </div>
    </div>
  );
}
