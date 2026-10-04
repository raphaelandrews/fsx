import type { ReactNode } from "react";

import { cn } from "@fsx/ui/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-3 text-card-foreground", className)}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-xl tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
