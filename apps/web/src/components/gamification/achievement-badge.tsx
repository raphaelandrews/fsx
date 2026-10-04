import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  ChampionIcon,
  ChartUpIcon,
  ChessPawnIcon,
  FireIcon,
  LockIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";

import type { Achievement, BadgeIcon } from "@fsx/api/gamification/badges";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";
import { cn } from "@fsx/ui/lib/utils";

import { TIER_CLASSES, TIER_LABELS, formatIsoDate } from "./tier";

const ICONS: Record<BadgeIcon, typeof StarIcon> = {
  rating: ChartUpIcon,
  tournaments: ChessPawnIcon,
  streak: FireIcon,
  first: StarIcon,
  podium: Award01Icon,
  trophy: ChampionIcon,
};

function earnedText(achievement: Achievement) {
  if (achievement.legacy) return "Conquista anterior aos registros da FSX";
  if (!achievement.earnedAt) return "Data desconhecida";
  return `Conquistada em ${formatIsoDate(achievement.earnedAt)}`;
}

export function AchievementBadge({ achievement, locked = false }: { achievement: Achievement; locked?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${achievement.label}${locked ? " (bloqueada)" : ""}`}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-ring",
          locked ? "bg-muted text-muted-foreground" : TIER_CLASSES[achievement.tier],
        )}
      >
        <HugeiconsIcon icon={locked ? LockIcon : ICONS[achievement.icon]} className="size-5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-1 p-3 text-sm">
        <p className="font-medium">{achievement.label}</p>
        <p className="text-muted-foreground">{achievement.description}</p>
        <p className="text-muted-foreground text-xs">
          {locked ? "Ainda não conquistada" : `${TIER_LABELS[achievement.tier]} · ${earnedText(achievement)}`}
        </p>
      </PopoverContent>
    </Popover>
  );
}
