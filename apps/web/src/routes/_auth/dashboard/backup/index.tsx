import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard/backup/")({
  head: () => ({ meta: [{ title: "Backup - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Backup</h1>

      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Cloudflare D1 Export</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Run it locally to export the D1 database:
        </p>
        <code className="block rounded bg-muted p-3 text-xs">
          npx wrangler d1 export fsx-db --remote --output=./backup.sql
        </code>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Cloudflare Dashboard</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Alternatively, open the Cloudflare dashboard to manage backups:
        </p>
        <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
          <li>Workers &amp; Pages &rarr; D1 &rarr; fsx-db &rarr; Backups</li>
          <li>Manual downloads and restore available</li>
          <li>Automatic daily backups (last 7 days)</li>
        </ul>
      </div>
    </div>
  );
}
