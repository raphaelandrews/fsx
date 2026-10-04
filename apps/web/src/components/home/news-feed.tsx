import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, ScrollIcon, SparklesIcon } from "@hugeicons/core-free-icons";

import type { FeedItem } from "@fsx/api/gamification/feed";
import { cn } from "@fsx/ui/lib/utils";

import { Section } from "./section";
import { SectionButton } from "@/components/section-button";
import { BADGE_ICONS } from "@/components/gamification/achievement-badge";
import { TIER_CLASSES, formatIsoDate } from "@/components/gamification/tier";

function itemIcon(item: FeedItem) {
  if (item.icon === "title") return CrownIcon;
  if (item.icon === "announcement") return ScrollIcon;
  return BADGE_ICONS[item.icon];
}

export function NewsFeed({ items }: { items: FeedItem[] }) {
  return (
    <Section icon={SparklesIcon} label="Novidades" main={false}>
      <ul className="grid md:grid-cols-2">
        {items.map((item) => {
          const name = item.player.nickname || item.player.name;
          const player = (
            <Link to="/jogadores/$id" params={{ id: item.player.id }} className="font-semibold hover:underline">
              {name}
            </Link>
          );
          return (
            <li key={`${item.kind}-${item.player.id}-${item.label}-${item.date}`} className="m-1">
              <div className="flex items-start gap-3 rounded-md p-3 text-sm transition-colors duration-200 hover:bg-muted/50">
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                    item.kind === "announcement" ? "bg-muted text-muted-foreground" : TIER_CLASSES.gold,
                  )}
                  aria-hidden
                >
                  <HugeiconsIcon icon={itemIcon(item)} className="size-4" strokeWidth={1.75} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-pretty leading-snug">
                    {item.kind === "achievement" && (
                      <>
                        {player} conquistou <span className="font-medium">{item.label}</span>
                      </>
                    )}
                    {item.kind === "title" && (
                      <>
                        {player} recebeu o título <span className="font-medium">{item.label}</span>
                      </>
                    )}
                    {item.kind === "announcement" && item.announcementId !== null && (
                      <>
                        <Link to="/comunicados/$id" params={{ id: item.announcementId }} className="font-semibold hover:underline">
                          {item.label}
                        </Link>{" "}
                        sobre {player}
                      </>
                    )}
                  </span>
                  <time dateTime={item.date.slice(0, 10)} className="text-muted-foreground text-xs tabular-nums">
                    {formatIsoDate(item.date)}
                  </time>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <SectionButton href="/recordes" label="Ver recordes" />
    </Section>
  );
}
