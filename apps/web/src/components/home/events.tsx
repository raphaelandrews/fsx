import { Trophy } from "@hugeicons/core-free-icons";

import { federationToday } from "@fsx/api/lib/dates";

import { CalendarEvent } from "@/components/calendario/calendar-event";
import type { EventData } from "@/components/events/event-links";

import { Section } from "./section";

export function Events({ events }: { events: EventData[] }) {
  // A fixed time zone keeps server (UTC) and client on the same "today", so hydration matches.
  const today = federationToday();

  // The API returns upcoming events in date order; the filter only drops ones a cached response kept
  // past their last day.
  const upcoming = events.filter((event) => (event.endDate ?? event.startDate).slice(0, 10) >= today).slice(0, 6);

  if (upcoming.length === 0) return null;

  return (
    <Section icon={Trophy} label="Próximos Eventos" main={false}>
      <ul className="grid gap-3 px-3 sm:px-0 md:grid-cols-2">
        {upcoming.map((event) => (
          <CalendarEvent key={event.id} event={event} today={today} showCountdown />
        ))}
      </ul>
    </Section>
  );
}
