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
          Execute localmente para exportar o banco de dados D1:
        </p>
        <code className="block rounded bg-muted p-3 text-xs">
          npx wrangler d1 export fsx-db --remote --output=./backup.sql
        </code>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Cloudflare Dashboard</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Alternativamente, acesse o painel da Cloudflare para gerenciar backups:
        </p>
        <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
          <li>Workers &amp; Pages &rarr; D1 &rarr; fsx-db &rarr; Backups</li>
          <li>Downloads manuais e restauração disponíveis</li>
          <li>Backups automáticos diários (últimos 7 dias)</li>
        </ul>
      </div>
    </div>
  );
}
