import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, ScrollIcon } from "@hugeicons/core-free-icons";

import { padNumber } from "@/utils/format";

// Same row as the home page's announcements, so a linked announcement looks familiar.
export function PlayerAnnouncements({
  announcements,
}: {
  announcements: { id: number; year: number; number: number; excerpt: string }[];
}) {
  if (announcements.length === 0) return null;
  return (
    <ul className="flex flex-col pb-2">
      {announcements.map((announcement) => (
        <li key={announcement.id} className="m-1">
          <Link
            to="/comunicados/$id"
            params={{ id: announcement.id }}
            className="group flex flex-col gap-2 rounded-md p-3 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={ScrollIcon} size={14} className="text-muted-foreground" aria-hidden />
                <span className="font-bold text-sm leading-tight">
                  Comunicado {padNumber(announcement.number)}/{announcement.year}
                </span>
              </span>
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                className="text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden
              />
            </span>
            <span className="line-clamp-2 text-muted-foreground text-xs">{announcement.excerpt}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
