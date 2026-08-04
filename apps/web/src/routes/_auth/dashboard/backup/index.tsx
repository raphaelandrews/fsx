import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard/backup/")({
  head: () => ({ title: "Backup - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Backup</h1>
      <p className="mb-4 text-muted-foreground text-sm">
        Database backup and export functionality will be available here. For now, use the Cloudflare D1 dashboard or
        <code className="mx-1 rounded bg-muted px-1 text-xs">wrangler d1 export</code>
        to export your database.
      </p>
      <div className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">D1 Export</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Run the following command locally to export your D1 database:
        </p>
        <code className="block rounded bg-muted p-3 text-xs">
          npx wrangler d1 export fsx-db --remote --output=./backup.sql
        </code>
      </div>
    </div>
  );
}
