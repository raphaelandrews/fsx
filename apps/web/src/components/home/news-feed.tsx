import { Link } from "@tanstack/react-router";
import { SparklesIcon } from "@hugeicons/core-free-icons";

import type { FeedItem } from "@fsx/api/gamification/feed";

import { Section } from "./section";
import { SectionButton } from "@/components/section-button";
import { formatIsoDate } from "@/components/gamification/tier";

export function NewsFeed({ items }: { items: FeedItem[] }) {
  return (
    <Section icon={SparklesIcon} label="Novidades" main={false}>
      <ul className="divide-y px-3">
        {items.map((item) => {
          const name = item.player.nickname || item.player.name;
          const player = (
            <Link to="/jogadores/$id" params={{ id: item.player.id }} className="font-medium hover:underline">
              {name}
            </Link>
          );
          return (
            <li key={`${item.kind}-${item.player.id}-${item.label}-${item.date}`} className="flex items-baseline gap-3 py-2 text-sm">
              <span className="w-20 shrink-0 text-muted-foreground text-xs tabular-nums">{formatIsoDate(item.date)}</span>
              <span>
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
                    <Link to="/comunicados/$id" params={{ id: item.announcementId }} className="font-medium hover:underline">
                      {item.label}
                    </Link>{" "}
                    sobre {player}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <SectionButton href="/recordes" label="Ver recordes" />
    </Section>
  );
}
