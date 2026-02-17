"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { events } from "@/db/schema"

interface UpdateEventInput {
	id: number
	name: string
	chessResults: string | null
	startDate: string // ISO string
	endDate: string | null // ISO string
	regulation: string | null
	form: string | null
	type: "open" | "closed" | "school"
	timeControl: "standard" | "rapid" | "blitz" | "bullet"
}

export async function updateEvent(input: UpdateEventInput) {
	try {
		const updatedEvents = await db
			.update(events)
			.set({
				name: input.name,
				chessResults: input.chessResults || null,
				startDate: new Date(input.startDate),
				endDate: input.endDate ? new Date(input.endDate) : null,
				regulation: input.regulation || null,
				form: input.form || null,
				type: input.type,
				timeControl: input.timeControl,
			})
			.where(eq(events.id, input.id))
			.returning()

		if (updatedEvents.length === 0) {
			return { success: false, error: "Event not found" }
		}

		revalidateTag("events", "max")
		revalidatePath("/")
		revalidatePath("/eventos")

		return { success: true, data: updatedEvents[0] }
	} catch (error) {
		console.error("Error updating event:", error)
		return { success: false, error: "Failed to update event" }
	}
}
