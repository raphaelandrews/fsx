import type { JSX } from "react";
import { CalendarIcon, ClockIcon, TrophyIcon } from "lucide-react";

import type { Event } from "@/db/queries";

import { Section } from "./section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Events({ events }: { events: Event[] }) {
  return (
    <Section icon={TrophyIcon} label="Próximos Eventos" main={false}>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {events?.map((event: Event) => (
          <EventCard
            form={event.form}
            key={event.id}
            name={event.name}
            regulation={event.regulation}
            startDate={event.startDate}
            timeControl={event.timeControl}
            type={event.type}
          />
        ))}
      </div>
    </Section>
  );
}

function EventCard({
  name,
  startDate,
  form,
  regulation,
  type,
  timeControl,
}: {
  name: string;
  startDate: string | Date;
  form: string | null;
  regulation: string | null;
  type: string;
  timeControl: string;
}) {
  const dateObj =
    typeof startDate === "string" ? new Date(startDate) : startDate;

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(dateObj)
    .replace(/de\s/g, "")
    .replace(".", "")
    .replace(/^\d+\s(\w)/, (match, p1) => match.replace(p1, p1.toUpperCase()))
    .replace(/^1\s/, "1º ");

  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(dateObj)
    .replace(":00", "h")
    .replace(":", "h");

  const getDotColor = () => {
    const currentDate = new Date();
    const timeDifference = dateObj.getTime() - currentDate.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    if (daysDifference < 0) {
      return (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
        </span>
      );
    }

    if (daysDifference <= 7) {
      return (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
        </span>
      );
    }

    if (daysDifference <= 14) {
      return (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
        </span>
      );
    }

    return null;
  };

  return (
    <div className="grid content-between gap-3 w-full rounded-lg border-2 bg-muted p-4 dark:border-none dark:bg-[#121212]">
      <div className="grid gap-3 w-full">
        <div className="flex justify-between gap-1">
          <h3 className="line-clamp-2 font-medium text-foreground/80 leading-none">
            {name}
          </h3>
          {getDotColor()}
        </div>
        <div className="mt-3 flex gap-1 font-medium text-foreground/60 text-xs">
          <Badge variant="outline">
            <CalendarIcon size={12} />
            <span>{formattedDate}</span>
          </Badge>
          <Badge variant="outline">
            <ClockIcon size={12} />
            <span>{formattedTime}</span>
          </Badge>
        </div>
        <div className="flex gap-1">
          {formattedBadge({ type })}
          {formattedBadge({ timeControl })}
        </div>
      </div>
      {form && regulation ? (
        <div className="grid grid-cols-2 gap-1.5">
          <Button asChild variant="outline">
            <a href={form} rel="noreferrer" target="_blank">
              Formulário
            </a>
          </Button>
          <Button asChild>
            <a href={regulation} rel="noreferrer" target="_blank">
              Regulamento
            </a>
          </Button>
        </div>
      ) : (
        <Button variant="secondary" disabled={true} className="w-full">
          Em Breve
        </Button>
      )}
    </div>
  );
}

export function formattedBadge({
  type,
  timeControl,
}: {
  type?: string;
  timeControl?: string;
}) {
  const badgeMap: { [key: string]: JSX.Element } = {
    open: <Badge variant="bulbasaur">Aberto</Badge>,
    closed: <Badge variant="strawberry">Fechado</Badge>,
    school: <Badge variant="jam">Escolar</Badge>,

    standard: <Badge variant="noir">Clássico</Badge>,
    rapid: <Badge variant="sea">Rápido</Badge>,
    blitz: <Badge variant="ice">Blitz</Badge>,
    bullet: <Badge variant="raspberry">Bullet</Badge>,
  };

  if (type && badgeMap[type]) {
    return badgeMap[type];
  }

  if (timeControl && badgeMap[timeControl]) {
    return badgeMap[timeControl];
  }

  return null;
}
