import { Link } from "@tanstack/react-router";

import { cn } from "@fsx/ui/lib/utils";

import { EventLinkButton, EventVenue, orderedEventLinks, type EventData } from "@/components/events/event-links";

import { eventPeriod, isFinished, monthShort } from "./dates";

const DAY_MS = 86_400_000;
const dayNumber = (isoDate: string) => Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`) / DAY_MS;

function countdown(days: number) {
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `Em ${days} dias`;
}

export function CalendarEvent({ event, today, showCountdown = false }: { event: EventData; today: string; showCountdown?: boolean }) {
  const finished = isFinished(event.endDate, event.startDate, today);
  const [, month, day] = event.startDate.slice(0, 10).split("-").map(Number) as [number, number, number];
  const links = orderedEventLinks(event.linkGroup?.links);
  const daysUntil = dayNumber(event.startDate) - dayNumber(today);

  return (
    <li className={cn("flex gap-4 rounded-2xl bg-muted p-4", finished && "opacity-70")}>
      <time
        dateTime={event.startDate.slice(0, 10)}
        className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-background leading-none"
      >
        <span className="font-semibold text-xl tabular-nums">{day}</span>
        <span className="mt-1 text-muted-foreground text-xs uppercase">{monthShort(month)}</span>
      </time>
      <div className="grid min-w-0 flex-1 gap-2">
        <div>
          {showCountdown && !finished && daysUntil >= 0 && daysUntil <= 14 ? (
            <span
              className={cn(
                "mb-1 inline-block rounded-full px-2 py-0.5 font-semibold text-xs",
                daysUntil <= 7 ? "bg-warning text-warning-foreground" : "bg-background text-muted-foreground",
              )}
            >
              {countdown(daysUntil)}
            </span>
          ) : null}
          <h3 className="font-semibold text-base leading-snug">
            {event.tournamentId ? (
              <Link to="/torneios/$id" params={{ id: event.tournamentId }} className="hover:underline">
                {event.name}
              </Link>
            ) : (
              event.name
            )}
          </h3>
          <p className="text-muted-foreground text-sm">
            {eventPeriod(event.startDate, event.endDate)}
            {finished ? " · Encerrado" : ""}
          </p>
          <EventVenue event={event} />
        </div>
        {links.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <EventLinkButton key={link.id} link={link} size="sm" primary={link.type === "form" && !finished} />
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
