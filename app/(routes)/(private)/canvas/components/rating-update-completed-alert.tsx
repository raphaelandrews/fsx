import { CheckCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RatingUpdateCompletedAlert() {
  return (
    <Alert className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 w-fit">
      <CheckCircleIcon className="text-green-500" />
      <AlertTitle>Completed</AlertTitle>
      <AlertDescription>All file operations have finished.</AlertDescription>
    </Alert>
  );
}
