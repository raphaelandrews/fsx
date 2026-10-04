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

export const BADGE_ICONS: Record<BadgeIcon, typeof StarIcon> = {
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
          "inline-flex size-11 items-center justify-center rounded-full outline-offset-2 transition-[scale,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.96]",
          locked
            ? "border border-border border-dashed text-muted-foreground hover:bg-muted"
            : cn(TIER_CLASSES[achievement.tier], "shadow-[inset_0_0_0_1px_oklch(0_0_0/0.06)] hover:shadow-[inset_0_0_0_1px_currentColor] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.08)]"),
        )}
      >
        <HugeiconsIcon icon={locked ? LockIcon : BADGE_ICONS[achievement.icon]} className="size-5" strokeWidth={1.75} aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-64 gap-2 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
              locked ? "bg-muted text-muted-foreground" : TIER_CLASSES[achievement.tier],
            )}
            aria-hidden
          >
            <HugeiconsIcon icon={BADGE_ICONS[achievement.icon]} className="size-4" strokeWidth={1.75} />
          </span>
          <p className="font-medium leading-tight">{achievement.label}</p>
        </div>
        <p className="text-pretty text-muted-foreground">{achievement.description}</p>
        <p className="text-muted-foreground text-xs">
          {locked ? "Próxima conquista · ainda não alcançada" : `${TIER_LABELS[achievement.tier]} · ${earnedText(achievement)}`}
        </p>
      </PopoverContent>
    </Popover>
  );
}
