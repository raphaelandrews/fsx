import type { Achievement } from "@fsx/api/gamification/badges";

import { ProgressBar } from "@/components/gamification/achievement-badge";

export function PlayerMilestone({ milestone }: { milestone: Achievement | null }) {
  if (!milestone?.progress) return null;
  const { current, target } = milestone.progress;
  return (
    <div className="flex w-60 flex-col gap-1.5 text-left">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Próximo marco</span>
        <span className="text-muted-foreground tabular-nums">
          {current} / {target}
        </span>
      </p>
      <p className="font-semibold text-sm leading-tight">{milestone.label}</p>
      <ProgressBar current={current} target={target} />
    </div>
  );
}
