import { useRatingUpdateStore } from "@/app/(private)/private/rating-update/hooks/rating-update-store";
import { Progress, ProgressLabel, ProgressTrack } from "./ui/progress";
import { Badge } from "@/components/ui/badge";

export function RatingUpdateProgress() {
  const { currentIndex, totalUpdates } = useRatingUpdateStore();

  const progress = totalUpdates > 0 ? (currentIndex / totalUpdates) * 100 : 0;

  return (
    <Progress value={progress} className="w-[300px] space-y-2">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <ProgressLabel className="text-sm font-medium">
          <Badge variant="sea" className="rounded-sm">
            {currentIndex}/{totalUpdates}
          </Badge>
        </ProgressLabel>
        <Badge variant="bulbasaur" className="rounded-sm">
          {progress.toFixed(1)} %
        </Badge>
      </div>
      <ProgressTrack />
    </Progress>
  );
}
