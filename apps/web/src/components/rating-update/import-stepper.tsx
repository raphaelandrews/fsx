import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

import { cn } from "@fsx/ui/lib/utils";

import type { ImportPhase } from "@/hooks/use-rating-import";

const STEPS = ["Upload", "Review", "Import"] as const;
const CURRENT: Record<ImportPhase, number> = { upload: 0, review: 1, importing: 2, done: 2 };

export function ImportStepper({ phase }: { phase: ImportPhase }) {
  const current = CURRENT[phase];
  return (
    <ol aria-label="Import steps" className="flex items-center gap-2 text-sm">
      {STEPS.map((label, index) => {
        const complete = index < current || (index === current && phase === "done");
        const active = index === current && phase !== "done";
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border font-semibold text-xs tabular-nums",
                complete && "border-success bg-success text-background",
                active && "border-primary bg-primary text-primary-foreground",
                !complete && !active && "text-muted-foreground",
              )}
            >
              {complete ? <HugeiconsIcon icon={Tick02Icon} className="size-3.5" strokeWidth={2.5} aria-label="Done" /> : index + 1}
            </span>
            <span className={cn("font-medium", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {index < STEPS.length - 1 ? <span className="mx-1 h-px w-8 bg-border sm:w-12" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
