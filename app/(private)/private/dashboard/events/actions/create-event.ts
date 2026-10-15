"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { events } from "@/db/schema"
import { withSequenceFix } from "@/lib/with-sequence-fix"

interface CreateEventInput {
	name: string
	startDate: string
	endDate: string | null
	type: "open" | "closed" | "school"
	timeControl: "standard" | "rapid" | "blitz" | "bullet"
	chessResults: string | null
	regulation: string | null
	form: string | null
}

export async function createEvent(input: CreateEventInput) {
	try {
		const newEvent = await withSequenceFix("events", () =>
			db
				.insert(events)
				.values({
					name: input.name,
					startDate: new Date(input.startDate),
					endDate: input.endDate ? new Date(input.endDate) : null,
					type: input.type,
					timeControl: input.timeControl,
					chessResults: input.chessResults,
					regulation: input.regulation,
					form: input.form,
				})
				.returning()
		)

		revalidateTag("events", "default")
		revalidatePath("/")
		revalidatePath("/private/dashboard/events")

		return { success: true, data: newEvent[0] }
	} catch (error) {
		console.error("Error creating event:", error)
		return { success: false, error: "Failed to create event" }
	}
}
