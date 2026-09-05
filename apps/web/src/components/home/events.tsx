import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Trophy } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";

import { Section } from "./section";
import { StatusDot } from "./status-dot";

export interface EventLink {
  id: number;
  href: string | null;
  label: string;
}

export interface Event {
  id: number;
  name: string;
  startDate: string;
  linkGroup?: { id: number; links: EventLink[] } | null;
}

export function Events({ events }: { events: Event[] }) {
  // Fixed timezone so the server (UTC) and client pick the same "today" and
  // avoid a hydration mismatch. en-CA yields an ISO YYYY-MM-DD string.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const upcoming = [...events]
    .filter((event) => (event.startDate ?? "").slice(0, 10) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 6);

  if (upcoming.length === 0) return null;

  return (
    <Section icon={Trophy} label="Próximos Eventos" main={false}>
      <div className="grid sm:grid-cols-2 md:grid-cols-3">
        {upcoming.map((event) => (
          <EventCard
            key={event.id}
            name={event.name}
            startDate={event.startDate}
            links={event.linkGroup?.links ?? []}
          />
        ))}
      </div>
    </Section>
  );
}

function EventCard({
  name,
  startDate,
  links,
}: {
  name: string;
  startDate: string | Date;
  links: EventLink[];
}) {
  // startDate is a date-only "YYYY-MM-DD" string. new Date("YYYY-MM-DD")
  // parses as UTC midnight; formatting that in America/Sao_Paulo (UTC-3)
  // shifts it back a day (17 -> 16). Parse as UTC and format in UTC so the
  // stored calendar date renders exactly, with identical server/client output.
  const dateObj = typeof startDate === "string" ? new Date(startDate + "T00:00:00Z") : startDate;

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(dateObj)
    .replace(/de\s/g, "")
    .replace(".", "")
    .replace(/^\d+\s(\w)/, (match, p1) => match.replace(p1, p1.toUpperCase()))
    .replace(/^1\s/, "1º ");

  return (
    <div>
      <div className="m-1">
        <div className="flex items-center justify-between p-3">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold leading-tight line-clamp-2">{name}</h3>
              <StatusDot date={startDate} />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground select-none text-xs font-medium">
              <HugeiconsIcon icon={Calendar01Icon} size={14} /> <span>{formattedDate}</span>
            </div>
            {links.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {links.map((link) => {
                  const isForm = link.label
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .startsWith("formul");
                  if (link.href) {
                    return (
                      <Button
                        key={link.id}
                        size="sm"
                        variant={isForm ? "default" : "outline"}
                        className="h-8"
                        onClick={() => window.open(link.href!, "_blank", "noreferrer")}
                      >
                        {link.label}
                      </Button>
                    );
                  }
                  return (
                    <Button key={link.id} size="sm" variant="outline" disabled className="h-8">
                      {link.label}
                      <span className="ml-1 text-xs opacity-70">(em breve)</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <Button variant="secondary" disabled={true} className="w-fit h-8 mt-1" size="sm">
                Em Breve
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
