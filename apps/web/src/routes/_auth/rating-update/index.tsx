import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@fsx/ui/components/button";

import { AdminPageHeader } from "@/components/admin/page-header";
import { InlineAlert } from "@/components/admin/inline-alert";
import { ImportDropzone } from "@/components/rating-update/import-dropzone";
import { ImportProgress } from "@/components/rating-update/import-progress";
import { ImportResults } from "@/components/rating-update/import-results";
import { ImportReview } from "@/components/rating-update/import-review";
import { ImportStepper } from "@/components/rating-update/import-stepper";
import { useRatingImport } from "@/hooks/use-rating-import";
import { useAdminMutation } from "@/lib/admin-mutations";
import { reportMaintenance } from "@/lib/rating-import-feedback";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/rating-update/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Rating update - Admin - FSX" }] }),
  component: RatingUpdatePage,
});

function RatingUpdatePage() {
  const trpc = useTRPC();
  const flow = useRatingImport();

  // Applies the 3-year inactivity rule and records a ranking snapshot without
  // waiting for the next import (movement compares two snapshots).
  const manualSnapshot = useAdminMutation(trpc.playersTournament.snapshotRankings.mutationOptions(), {
    invalidates: "playersTournament",
    success: "Rankings updated",
    failure: "Failed to update the rankings",
    onSuccess: reportMaintenance,
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard"
        backLabel="Dashboard"
        title="Rating update"
        description="Apply tournament rating variations from a Swiss Manager Excel export. To fix a result afterwards, use the player's Rating history."
        actions={
          <Button
            variant="outline"
            disabled={flow.phase === "importing"}
            loading={manualSnapshot.isPending}
            onClick={() => manualSnapshot.mutate({ ratingTypes: ["classic", "rapid", "blitz"] })}
          >
            Update rankings now
          </Button>
        }
      />

      <div className="mx-auto max-w-5xl space-y-8">
        <ImportStepper phase={flow.phase} />

        {flow.phase === "upload" ? (
          <ImportDropzone onFile={(file) => void flow.loadFile(file)} reading={flow.reading} error={flow.loadError} />
        ) : null}

        {flow.phase === "review" ? (
          <ImportReview
            fileName={flow.fileName}
            plan={flow.plan}
            draft={flow.draft}
            podium={flow.podium}
            summary={flow.summary}
            onImport={() => void flow.start()}
            onCancel={flow.reset}
          />
        ) : null}

        {flow.phase === "importing" ? (
          <ImportProgress progress={flow.progress} results={flow.results} onStop={flow.stop} />
        ) : null}

        {flow.phase === "done" ? (
          <>
            {flow.restored && flow.results.some((result) => result.status === "failed") ? (
              <InlineAlert tone="info" title="This report comes from an earlier visit">
                To retry its failed rows, correct the file and upload it again; rows that already applied are rejected as
                duplicates.
              </InlineAlert>
            ) : null}
            <ImportResults
              fileName={flow.fileName}
              results={[...flow.results, ...flow.skipped]}
              notRun={flow.notRun}
              retryable={flow.remaining}
              maintenance={flow.maintenance}
              snapshotError={flow.snapshotError}
              restored={flow.restored}
              onResume={() => void flow.resume()}
              onReset={flow.reset}
            />
          </>
        ) : null}
      </div>
    </>
  );
}
