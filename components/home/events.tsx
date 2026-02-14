import type { JSX } from "react"
import { CalendarIcon, ClockIcon, TrophyIcon } from "lucide-react"
import type { Event } from "@/db/queries"
import { Section } from "./section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { StatusDot } from "./status-dot"
import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"
import { Separator } from "@/components/ui/separator"

export function Events({ events }: { events: Event[] }) {
	return (
		<Section icon={TrophyIcon} label="Próximos Eventos" main={false}>
			<DottedX className="p-0">
				<div className="flex flex-col">
					{events?.map((event: Event, index: number) => (
						<EventCard
							form={event.form}
							key={event.id}
							name={event.name}
							regulation={event.regulation}
							startDate={event.startDate}
							timeControl={event.timeControl}
							type={event.type}
							isLast={index === events.length - 1}
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
	isLast,
}: {
	name: string
	startDate: string | Date
	form: string | null
	regulation: string | null
	type: string
	timeControl: string
	isLast: boolean
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
							<CalendarIcon size={14} /> <span>{formattedDate}</span>
							<Separator orientation="vertical" className="h-4 mx-1.5" />
							<ClockIcon size={14} /> <span>{formattedTime}</span>
						</div>
						<div className="flex gap-1.5 align-middle">
							{formattedBadge({ type })}
							{formattedBadge({ timeControl })}
						</div>
						{(form || regulation) && (
							<div className="flex gap-2 mt-1">
								{form && (
									<Button asChild size="sm" variant="outline" className="h-8">
										<a href={form} target="_blank" rel="noreferrer">
											Formulário
										</a>
									</Button>
								)}
								{regulation && (
									<Button asChild size="sm" variant="default" className="h-8">
										<a href={regulation} target="_blank" rel="noreferrer">
											Regulamento
										</a>
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
			{!isLast && <DottedSeparator className="w-full" />}
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
		open: <Badge variant="greenPastel">Aberto</Badge>,
		closed: <Badge variant="redPastel">Fechado</Badge>,
		school: <Badge variant="lavenderPastel">Escolar</Badge>,

		standard: <Badge variant="yellowPastel">Clássico</Badge>,
		rapid: <Badge variant="skyPastel">Rápido</Badge>,
		blitz: <Badge variant="bluePastel">Blitz</Badge>,
		bullet: <Badge variant="pinkPastel">Bullet</Badge>,
	}

	if (type && badgeMap[type]) {
		return badgeMap[type]
	}

	if (timeControl && badgeMap[timeControl]) {
		return badgeMap[timeControl]
	}

	return null
}
