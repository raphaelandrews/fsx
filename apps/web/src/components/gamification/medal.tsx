import { HugeiconsIcon } from "@hugeicons/react";
import { MedalFirstPlaceIcon, MedalSecondPlaceIcon, MedalThirdPlaceIcon } from "@hugeicons/core-free-icons";

import { cn } from "@fsx/ui/lib/utils";

import { TIER_CLASSES } from "./tier";

const MEDALS = {
  1: { icon: MedalFirstPlaceIcon, tier: "gold", label: "1º lugar" },
  2: { icon: MedalSecondPlaceIcon, tier: "silver", label: "2º lugar" },
  3: { icon: MedalThirdPlaceIcon, tier: "bronze", label: "3º lugar" },
} as const;

export function Medal({ place, count, className }: { place: 1 | 2 | 3; count?: number; className?: string }) {
  const medal = MEDALS[place];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-xs", TIER_CLASSES[medal.tier], className)}
    >
      <HugeiconsIcon icon={medal.icon} className="size-4" aria-hidden />
      <span className="sr-only">{medal.label}</span>
      {count !== undefined && <span className="tabular-nums">×{count}</span>}
    </span>
  );
}
