import type { ReactNode } from "react";

import { cn } from "@fsx/ui/lib/utils";

// Same surface as the profile's rating and ID boxes, so stats read as one family.
export function StatTile({
  label,
  value,
  hint,
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-muted p-3 text-center sm:p-4", className)}>
      <span className="font-medium text-foreground/70 text-xs sm:text-sm">{label}</span>
      <span className={cn("font-semibold text-base tabular-nums sm:text-lg", valueClassName)}>{value}</span>
      {hint && <span className="line-clamp-2 text-pretty text-[11px] text-foreground/70">{hint}</span>}
    </div>
  );
}
