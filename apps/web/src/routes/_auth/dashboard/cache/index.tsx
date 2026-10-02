import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/cache/")({
  head: () => ({ meta: [{ title: "Cache - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.security.rateLimitStats.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: rateLimitStats } = useSuspenseQuery(trpc.security.rateLimitStats.queryOptions());

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Cache</h1>

      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Automatic Caching</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          The Cloudflare CDN manages the cache automatically:
        </p>
        <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
          <li>Only allowlisted public tRPC GET procedures use the edge cache</li>
          <li>TTL is procedure-specific, from 30 seconds to 5 minutes</li>
          <li>Authenticated requests, mutations, unknown procedures, and errors bypass the cache</li>
          <li>POST mutations bypass the cache automatically</li>
        </ul>
      </div>

      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Rate-limit storage</h2>
        <p className="text-sm text-muted-foreground">
          {rateLimitStats.rows.toLocaleString("pt-BR")} janela(s) armazenada(s).
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Janela mais antiga: {formatUtc(rateLimitStats.oldestWindowStart)} · mais recente: {formatUtc(rateLimitStats.newestWindowStart)}
        </p>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Manual Purge</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Anonymous users may see a successful response until its procedure TTL
          expires. Use the Cloudflare dashboard only for operational recovery:
        </p>
        <ol className="list-decimal pl-5 text-muted-foreground text-sm space-y-1">
          <li>Cloudflare Dashboard &rarr; Websites &rarr; fsx.chess</li>
          <li>Caching &rarr; Configuration &rarr; Purge Cache</li>
          <li>Select &quot;Purge Everything&quot; to clear all cached content</li>
        </ol>
      </div>
    </div>
  );
}

function formatUtc(value: number | null): string {
  if (value === null) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
