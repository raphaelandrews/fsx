import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

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

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FormSection } from "@/components/admin/form-layout";
import { AdminPageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/_auth/dashboard/cache/")({
  head: () => ({ meta: [{ title: "Cache - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.cache.status.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: cacheStatus } = useSuspenseQuery(trpc.cache.status.queryOptions());

  const purgeMutation = useAdminMutation(trpc.cache.purgePublic.mutationOptions(), {
    success: "Public cache purged in every data center",
    failure: "Failed to purge the cache",
  });

  return (
    <>
      <AdminPageHeader title="Cache" description="How public pages are cached and the emergency purge." />
      <div className="divide-y">

        <FormSection title="Edge cache">
        <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
          <li>Allowlisted public tRPC GET responses are cached by the Worker in each Cloudflare data center</li>
          <li>Each procedure has a TTL between 30 seconds and 5 minutes; after it, the next visitor gets fresh data</li>
          <li>Signed-in requests, mutations, unknown procedures, and errors always bypass the cache</li>
          <li>Browsers are told not to store API responses, so edits never wait on a browser cache</li>
        </ul>
        </FormSection>

        <FormSection title="Purge public cache">
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
        </FormSection>
      </div>
    </>
  );
}
