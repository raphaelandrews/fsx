import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@fsx/ui/components/alert-dialog";
import { Button } from "@fsx/ui/components/button";

import { getUserErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/cache/")({
  head: () => ({ meta: [{ title: "Cache - Admin - FSX" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(context.trpc.security.rateLimitStats.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.cache.status.queryOptions()),
    ]),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: rateLimitStats } = useSuspenseQuery(trpc.security.rateLimitStats.queryOptions());
  const { data: cacheStatus } = useSuspenseQuery(trpc.cache.status.queryOptions());

  const purgeMutation = useMutation({
    ...trpc.cache.purgePublic.mutationOptions(),
    onSuccess: () => toast.success("Public cache purged in every data center"),
    onError: (error) => toast.error(getUserErrorMessage(error, "Não foi possível limpar o cache.")),
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Cache</h1>

      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Edge cache</h2>
        <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
          <li>Allowlisted public tRPC GET responses are cached by the Worker in each Cloudflare data center</li>
          <li>Each procedure has a TTL between 30 seconds and 5 minutes; after it, the next visitor gets fresh data</li>
          <li>Signed-in requests, mutations, unknown procedures, and errors always bypass the cache</li>
          <li>Browsers are told not to store API responses, so edits never wait on a browser cache</li>
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
        <h2 className="mb-2 font-semibold">Purge public cache</h2>
        <p className="mb-3 text-muted-foreground text-sm">
          Anonymous visitors may see a previous response until its TTL expires. Purge only to
          recover from an urgent mistake; ordinary edits propagate on their own within minutes.
        </p>
        {cacheStatus.purgeConfigured ? (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" disabled={purgeMutation.isPending} />}>
              {purgeMutation.isPending ? "Purging..." : "Purge public cache"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Purge the public cache?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every Cloudflare data center drops its cached copies of the site. Visitors get fresh
                  data immediately, and the next requests are served from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => purgeMutation.mutate()}>Purge</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <ol className="list-decimal pl-5 text-muted-foreground text-sm space-y-1">
            <li>Cloudflare Dashboard &rarr; the fsx.org.br zone</li>
            <li>Caching &rarr; Configuration &rarr; Purge Cache &rarr; Purge Everything</li>
            <li>
              To purge from here instead, set <code>CLOUDFLARE_ZONE_ID</code> and a{" "}
              <code>CLOUDFLARE_CACHE_PURGE_TOKEN</code> with the Zone &rarr; Cache Purge permission.
            </li>
          </ol>
        )}
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
