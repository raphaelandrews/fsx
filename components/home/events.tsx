import type { JSX } from "react"
import { CalendarIcon, ClockIcon, TrophyIcon } from "lucide-react"
import type { Event } from "@/db/queries"
import { Section } from "./section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { StatusDot } from "./status-dot"
import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"

export function Events({ events }: { events: Event[] }) {
	return (
		<Section icon={TrophyIcon} label="Próximos Eventos" main={false}>
			<DottedX className="p-0">
				<div className="relative grid sm:grid-cols-2">
					<div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-0 hidden md:block">
						<DottedSeparator />
					</div>
					<div className="absolute left-1/2 top-0 h-full -translate-x-1/2 z-0 hidden md:block">
						<DottedSeparator vertical />
					</div>
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
			</DottedX>
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

	const formattedDate = new Intl.DateTimeFormat("pt-BR", {
		day: "numeric",
		month: "short",
		year: "numeric",
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
	})
		.format(dateObj)
		.replace(":00", "h")
		.replace(":", "h")

	return (
		<div className="p-3">
			<div className="grid content-between gap-3 w-full rounded-lg border-2 bg-muted p-4 dark:border-none dark:bg-[#121212]">
				<div className="grid gap-3 w-full">
					<div className="flex justify-between gap-1">
						<h3 className="line-clamp-2 font-medium text-foreground/80 leading-none">
							{name}
						</h3>
						<StatusDot date={startDate} />
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
