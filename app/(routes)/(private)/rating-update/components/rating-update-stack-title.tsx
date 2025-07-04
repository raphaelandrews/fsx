import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function RatingUpdateStackTitle({
  title,
  length,
  stack,
}: {
  title: string;
  length: number;
  stack: boolean;
}) {
  return (
    <Alert
      variant={`${stack ? "success" : "destructive"}`}
      className="flex items-center gap-2 w-fit dark:border-none"
    >
      <AlertTitle>{title}</AlertTitle>
      <Badge
        className={`${
          stack
            ? "bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994]"
            : "bg-[#FFEBEE] text-[#D32F2F] dark:bg-[#4D0217] dark:text-[#FF6982]"
        } rounded-sm`}
      >
        {length}
      </Badge>
    </Alert>
  );
}
