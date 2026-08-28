import type { JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, Clock01Icon, Trophy } from "@hugeicons/core-free-icons"

import { Section } from "./section"

interface Event {
  id: number
  name: string
  chessResults: string | null
  startDate: string
  endDate: string | null
  regulation: string | null
  form: string | null
  type: string
  timeControl: string
}
import { Badge } from "@fsx/ui/components/badge"
import { Button } from "@fsx/ui/components/button"
import { Separator } from "@fsx/ui/components/separator"

import { StatusDot } from "./status-dot"

export function Events({ events }: { events: Event[] }) {
  return (
    <Section icon={Trophy} label="Próximos Eventos" main={false}>
      <div className="grid sm:grid-cols-2 md:grid-cols-3">
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
  )
}

function EventCard({
  name,
  startDate,
  form,
  regulation,
  type,
  timeControl,
}: {
  name: string
  startDate: string | Date
  form: string | null
  regulation: string | null
  type: string
  timeControl: string
}) {
  const dateObj =
    typeof startDate === "string" ? new Date(startDate) : startDate

  // Format in a fixed timezone so server (UTC) and client render identical
  // output and avoid a hydration mismatch.
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
    .format(dateObj)
    .replace(/de\s/g, "")
    .replace(".", "")
    .replace(/^\d+\s(\w)/, (match, p1) => match.replace(p1, p1.toUpperCase()))
    .replace(/^1\s/, "1º ")

  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  })
    .format(dateObj)
    .replace(":00", "h")
    .replace(":", "h")

  return (
    <div>
      <div className="m-1">
        <div className="flex items-center justify-between p-3">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold leading-tight line-clamp-2">
                {name}
              </h3>
              <StatusDot date={startDate} />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground select-none text-xs font-medium">
              <HugeiconsIcon icon={Calendar01Icon} size={14} /> <span>{formattedDate}</span>
              <Separator orientation="vertical" className="h-4 mx-1.5" />
              <HugeiconsIcon icon={Clock01Icon} size={14} /> <span>{formattedTime}</span>
            </div>
            <div className="hidden gap-1.5 align-middle">
              {formattedBadge({ type })}
              {formattedBadge({ timeControl })}
            </div>
            {(form || regulation) && (
              <div className="flex gap-2 mt-1">
                {form && (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => window.open(form, "_blank", "noreferrer")}>
                    Formulário
                  </Button>
                )}
                {regulation && (
                  <Button size="sm" variant="default" className="h-8" onClick={() => window.open(regulation, "_blank", "noreferrer")}>
                    Regulamento
                  </Button>
                )}
              </div>
            )}
            {!form && !regulation && (
              <Button
                variant="secondary"
                disabled={true}
                className="w-fit h-8 mt-1"
                size="sm"
              >
                Em Breve
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function formattedBadge({
  type,
  timeControl,
}: {
  type?: string
  timeControl?: string
}) {
  const badgeMap: { [key: string]: JSX.Element } = {
    open: <Badge variant="bulbasaur">Aberto</Badge>,
    closed: <Badge variant="strawberry">Fechado</Badge>,
    school: <Badge variant="jam">Escolar</Badge>,

    standard: <Badge variant="noir">Clássico</Badge>,
    rapid: <Badge variant="sea">Rápido</Badge>,
    blitz: <Badge variant="ice">Blitz</Badge>,
    bullet: <Badge variant="raspberry">Bullet</Badge>,
  }

  if (type && badgeMap[type]) {
    return badgeMap[type]
  }

  if (timeControl && badgeMap[timeControl]) {
    return badgeMap[timeControl]
  }

  return null
}
