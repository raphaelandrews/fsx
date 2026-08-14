import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard/cache/")({
  head: () => ({ meta: [{ title: "Cache - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Cache</h1>

      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Caching Automático</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          A CDN da Cloudflare gerencia o cache automaticamente:
        </p>
        <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
          <li>Páginas públicas são pré-renderizadas no build (HTML estático)</li>
          <li>Respostas GET do tRPC têm cache de 5 minutos + stale-while-revalidate de 1 hora</li>
          <li>Mutações POST ignoram o cache automaticamente</li>
        </ul>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Purga Manual</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Para forçar a invalidação imediata do cache, use o painel da Cloudflare:
        </p>
        <ol className="list-decimal pl-5 text-muted-foreground text-sm space-y-1">
          <li>Cloudflare Dashboard &rarr; Websites &rarr; fsx.chess</li>
          <li>Caching &rarr; Configuration &rarr; Purge Cache</li>
          <li>Selecione &quot;Purge Everything&quot; para limpar todo o cache</li>
        </ol>
      </div>
    </div>
  );
}
