"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { events } from "@/db/schema"

interface CreateEventInput {
	name: string
	startDate: Date
	endDate: Date | null
	type: "open" | "closed" | "school"
	timeControl: "standard" | "rapid" | "blitz" | "bullet"
	chessResults: string | null
	regulation: string | null
	form: string | null
}

export async function createEvent(input: CreateEventInput) {
	try {
		const newEvent = await db
			.insert(events)
			.values({
				name: input.name,
				startDate: input.startDate,
				endDate: input.endDate,
				type: input.type,
				timeControl: input.timeControl,
				chessResults: input.chessResults,
				regulation: input.regulation,
				form: input.form,
			})
			.returning()

		revalidateTag("events", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/events")

		return { success: true, data: newEvent[0] }
	} catch (error) {
		console.error("Error creating event:", error)
		return { success: false, error: "Failed to create event" }
	}
}
