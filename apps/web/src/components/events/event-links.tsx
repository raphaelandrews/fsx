import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import type { inferRouterOutputs } from "@trpc/server";

import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { resolveEventLinkType } from "@fsx/api/event-link-types";
import type { AppRouter } from "@fsx/api/routers/index";

export type EventData = inferRouterOutputs<AppRouter>["events"]["calendar"][number];
export type EventLink = NonNullable<EventData["linkGroup"]>["links"][number];

const PREFERENCE: Record<string, number> = { form: 0, regulation: 1, results: 2 };

// Stored types of legacy event links are "link", so the type is recovered from the label first. The
// registration form comes first, then regulation and results.
export function orderedEventLinks(links: EventLink[] | undefined) {
  return (links ?? [])
    .map((link) => ({ ...link, type: resolveEventLinkType(link.type, link.label) }))
    .sort((a, b) => (PREFERENCE[a.type] ?? 9) - (PREFERENCE[b.type] ?? 9) || a.sortOrder - b.sortOrder);
}

export function EventLinkButton({
  link,
  primary = false,
  size = "lg",
  fill = false,
}: {
  link: EventLink;
  primary?: boolean;
  size?: "lg" | "sm";
  fill?: boolean;
}) {
  if (!link.href) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-dashed text-muted-foreground text-sm",
          size === "lg" ? "h-9 px-3.5" : "h-8 px-3",
        )}
      >
        {link.label} · em breve
      </span>
    );
  }

  // A real anchor keeps native open-in-new-tab and middle-click behavior.
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: primary ? "default" : "outline", size }), fill && "w-full", "active:scale-[0.96]")}
    >
      {link.label}
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        data-icon="inline-end"
        className="size-4 transition-transform duration-200 ease-out group-hover/button:-translate-y-px group-hover/button:translate-x-px"
        aria-hidden
      />
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

/** The venue's name, linked to its map or page when the event has a link for it. Either one alone is enough. */
export function EventVenue({ event }: { event: Pick<EventData, "venue" | "venueUrl"> }) {
  if (!event.venue && !event.venueUrl) return null;
  return (
    <p className="flex items-center gap-1 text-muted-foreground text-sm">
      <HugeiconsIcon icon={Location01Icon} className="size-4 shrink-0" aria-hidden />
      {event.venueUrl ? (
        <a href={event.venueUrl} target="_blank" rel="noreferrer" className="link-inline">
          {event.venue ?? "Ver local"}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : (
        event.venue
      )}
    </p>
  );
}
