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

import type { Achievement, BadgeIcon, BadgeTier } from "@fsx/api/gamification/badges";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";
import { cn } from "@fsx/ui/lib/utils";

import { TIER_LABELS, formatIsoDate } from "./tier";

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
            : "bg-muted text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--muted-foreground)]",
        )}
      >
        <HugeiconsIcon icon={locked ? LockIcon : BADGE_ICONS[achievement.icon]} className="size-5" strokeWidth={1.75} aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-64 gap-2 p-3 text-base">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted",
              locked ? "text-muted-foreground" : "text-foreground",
            )}
            aria-hidden
          >
            <HugeiconsIcon icon={BADGE_ICONS[achievement.icon]} className="size-4" strokeWidth={1.75} />
          </span>
          <p className="font-medium leading-tight">{achievement.label}</p>
        </div>
        <p className="text-pretty text-muted-foreground">{achievement.description}</p>
        <p className="text-muted-foreground text-sm">
          {locked ? "Próxima conquista · ainda não alcançada" : `${TIER_LABELS[achievement.tier]} · ${earnedText(achievement)}`}
        </p>
      </PopoverContent>
    </Popover>
  );
}

const TIER_ORDER: BadgeTier[] = ["platinum", "gold", "silver", "bronze"];

// Badges are neutral; the tier is a row label, so it reads without relying on color.
export function BadgesByTier({ achievements, upcoming = [] }: { achievements: Achievement[]; upcoming?: Achievement[] }) {
  const rows = [
    ...TIER_ORDER.map((tier) => ({
      key: tier,
      label: TIER_LABELS[tier],
      badges: achievements
        .filter((achievement) => achievement.tier === tier)
        .sort((a, b) => (b.earnedAt ?? "").localeCompare(a.earnedAt ?? "")),
      locked: false,
    })),
    { key: "upcoming", label: "Próximas", badges: upcoming, locked: true },
  ].filter((row) => row.badges.length > 0);

  return (
    <dl className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.key} className="flex items-start gap-3">
          <dt className="flex h-11 w-20 shrink-0 items-center font-medium text-muted-foreground text-sm">
            {row.label}
          </dt>
          <dd className="min-w-0 flex-1">
            <ul className="flex flex-wrap gap-2" aria-label={row.label}>
              {row.badges.map((achievement) => (
                <li key={`${row.key}-${achievement.id}`}>
                  <AchievementBadge achievement={achievement} locked={row.locked} />
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}
