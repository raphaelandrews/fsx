import { useSuspenseQuery } from "@tanstack/react-query";

import type { RatingType } from "@fsx/api/rating-types";
import { Button } from "@fsx/ui/components/button";

import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";

const FORMATS: { key: RatingType; label: string }[] = [
  { key: "classic", label: "Classic" },
  { key: "rapid", label: "Rapid" },
  { key: "blitz", label: "Blitz" },
];

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "America/Maceio" }).format(timestamp);

/** The Tier A strength lines behind the "Suggested tier" note, and the button that recomputes them. */
export function TierCalibrationCard() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.tournaments.tierCalibration.queryOptions());
  const recalibrate = useAdminMutation(trpc.tournaments.recalibrateTier.mutationOptions(), {
    invalidates: "tournaments",
    success: "Suggestion lines recalibrated",
    failure: "Failed to recalibrate",
  });

  return (
    <section className="mb-4 flex flex-col gap-3 rounded-2xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Tier suggestion calibration">
      <div className="flex flex-col gap-1 text-sm">
        <p className="font-medium text-base">Tier A suggestion lines</p>
        <p className="text-muted-foreground">
          Top-10 average rating a field needs for Tier A.{" "}
          {data.calibratedAt ? `Recalibrated on ${formatDate(data.calibratedAt)}.` : "Using the starting values."} Recalibrating sets them to the strongest
          quarter of the last 3 years of fields. It never changes a saved tier.
        </p>
        <dl className="flex flex-wrap gap-x-4 gap-y-1">
          {FORMATS.map(({ key, label }) => (
            <div key={key} className="flex gap-1.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{data.lines[key]}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Button variant="outline" disabled={recalibrate.isPending} onClick={() => recalibrate.mutate()}>
        {recalibrate.isPending ? "Recalibrating..." : "Recalibrate"}
      </Button>
    </section>
  );
}
