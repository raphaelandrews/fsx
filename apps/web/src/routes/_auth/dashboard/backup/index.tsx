import { createFileRoute } from "@tanstack/react-router";
import { FormSection } from "@/components/admin/form-layout";
import { AdminPageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/_auth/dashboard/backup/")({
  head: () => ({ meta: [{ title: "Backup - Admin - FSX" }] }),
  component: RouteComponent,
});

const DATABASE_NAME = "fsx-database-raphael";
const BACKUP_CMD = "bun run db:backup";
const BACKUP_PATH = `"$HOME/Backups/fsx-<timestamp>/fsx-<timestamp>.sql"`;
const VERIFY_CMD = `BACKUP_SQL=${BACKUP_PATH}
bun run db:backup:verify -- "$BACKUP_SQL"`;
const RESTORE_CMD = `STAGING_D1_DATABASE=fsx-staging
BACKUP_SQL=${BACKUP_PATH}
bunx wrangler d1 execute "$STAGING_D1_DATABASE" --remote --file="$BACKUP_SQL"`;

function Code({ children }: { children: string }) {
  return (
    <code className="mt-1 block overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
      {children}
    </code>
  );
}

function RouteComponent() {
  return (
    <>
      <AdminPageHeader title="Backup" description="Export, verify, and restore the D1 database. Backups run from your machine, not from the dashboard." />
      <div className="divide-y">

        <FormSection title="Full backup (SQL + CSV)">
        <p className="mb-3 text-muted-foreground text-sm">
          One command exports the entire remote database into a timestamped folder under{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">~/Backups</code>, as a full SQL dump plus
          one CSV per table. Nothing is written inside this repository.
        </p>
        <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            Log in to Cloudflare once, if needed:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">npx wrangler login</code>.
          </li>
          <li>Run it from the project root:</li>
        </ol>
        <Code>{BACKUP_CMD}</Code>
        <p className="mt-3 mb-1 text-muted-foreground text-sm">It creates a folder per run:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              ~/Backups/fsx-&lt;timestamp&gt;/fsx-&lt;timestamp&gt;.sql
            </code>{" "}
            — full dump (schema + data)
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              ~/Backups/fsx-&lt;timestamp&gt;/csv/&lt;table&gt;.csv
            </code>{" "}
            — one CSV per table
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground text-xs">
          Backups are private to the local account and pruned after 90 days by default. Set{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">BACKUP_RETENTION_DAYS</code> to change it.
          Requires <code className="rounded bg-muted px-1 py-0.5 text-foreground">sqlite3</code> on your PATH. The
          database is briefly blocked while the export runs. The script lives at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">scripts/d1-backup.sh</code>.
        </p>
        </FormSection>

        <FormSection title="Verify and restore to staging">
        <p className="mb-3 text-muted-foreground text-sm">
          Validate the dump locally, then restore it to a dedicated staging D1 database for recovery
          exercises. Never test recovery by overwriting production.
        </p>
        <Code>{VERIFY_CMD}</Code>
        <Code>{RESTORE_CMD}</Code>
        </FormSection>

        <FormSection title="Cloudflare Dashboard">
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
            Select <code className="rounded bg-muted px-1 py-0.5 text-foreground">{DATABASE_NAME}</code>.
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
        </FormSection>
      </div>
    </>
  );
}
