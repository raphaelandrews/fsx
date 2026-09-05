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
        <h2 className="mb-2 font-semibold">Automatic Caching</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          The Cloudflare CDN manages the cache automatically:
        </p>
        <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
          <li>Public pages are pre-rendered at build time (static HTML)</li>
          <li>tRPC GET responses are cached for 5 minutes + 1 hour stale-while-revalidate</li>
          <li>POST mutations bypass the cache automatically</li>
        </ul>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Manual Purge</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          To force immediate cache invalidation, use the Cloudflare dashboard:
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
