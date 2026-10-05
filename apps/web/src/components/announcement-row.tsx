import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ScrollIcon } from "@hugeicons/core-free-icons";

import { padNumber } from "@/utils/format";

export function AnnouncementRow({
  announcement,
}: {
  announcement: { id: number; year: number; number: number; excerpt: string };
}) {
  return (
    <li className="m-1">
      <Link
        to="/comunicados/$id"
        params={{ id: announcement.id }}
        className="group flex items-start gap-3 rounded-md p-3 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground" aria-hidden>
          <HugeiconsIcon icon={ScrollIcon} className="size-4" strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold text-base leading-snug tabular-nums">
            Comunicado {padNumber(announcement.number)}/{announcement.year}
          </span>
          <span className="line-clamp-2 text-muted-foreground text-sm">{announcement.excerpt}</span>
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-4 shrink-0 self-center text-muted-foreground transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </Link>
    </li>
  );
}
