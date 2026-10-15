"use client"

import { useEffect, useState, useMemo } from "react"
import { CalendarIcon } from "lucide-react"

function formatDate(date: Date) {
	const currentDate = new Date()
	const targetDate = new Date(date)
	targetDate.setUTCHours(targetDate.getUTCHours() + 3)

	const diffTime = Math.abs(currentDate.getTime() - targetDate.getTime())
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

	let months = (currentDate.getFullYear() - targetDate.getFullYear()) * 12
	months += currentDate.getMonth() - targetDate.getMonth()

	if (currentDate.getDate() < targetDate.getDate()) {
		months--
	}

	const years = Math.floor(months / 12)
	const remainingMonths = months % 12

	let formattedDate = ""

	if (years > 0) {
		formattedDate = `${years} ano${years > 1 ? "s" : ""}`
		if (remainingMonths > 0) {
			formattedDate += ` e ${remainingMonths} ${
				remainingMonths > 1 ? "meses" : "mês"
			}`
		}
	} else if (months > 0) {
		formattedDate = `${months} ${months > 1 ? "meses" : "mês"}`
	} else if (diffDays > 0) {
		formattedDate = `${diffDays} dia${diffDays > 1 ? "s" : ""}`
	} else {
		formattedDate = "Hoje"
	}

	const fullDate = targetDate.toLocaleString("pt-BR", {
		timeZone: "UTC",
		month: "long",
		day: "numeric",
		year: "numeric",
	})

	return (
		<>
			<p className="flex items-center gap-2">
				<CalendarIcon height={16} width={16} />
				<span className="mt-[1px]">{fullDate}</span>
			</p>
			<div className="h-1 w-1 rounded-full bg-muted-foreground" />
			<p>{formattedDate}</p>
		</>
	)
}

export function PostTimeAgo({ date }: { date: Date | string }) {
	const [mounted, setMounted] = useState(false)

	const targetDate = useMemo(() => new Date(date), [date])

	useEffect(() => {
		setMounted(true)
	}, [])

	const fullDateString = targetDate.toLocaleString("pt-BR", {
		timeZone: "UTC",
		month: "long",
		day: "numeric",
		year: "numeric",
	})

	if (!mounted) {
		return (
			<>
				<p className="flex items-center gap-2">
					<CalendarIcon height={16} width={16} />
					<span className="mt-[1px]">{fullDateString}</span>
				</p>
				<div className="h-1 w-1 rounded-full bg-muted-foreground" />
				<p>...</p>
			</>
		)
	}

	return formatDate(targetDate)
}
