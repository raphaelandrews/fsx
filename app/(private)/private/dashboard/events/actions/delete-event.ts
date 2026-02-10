"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { events } from "@/db/schema"

export async function deleteEvent(id: number) {
	try {
		const deletedEvents = await db
			.delete(events)
			.where(eq(events.id, id))
			.returning()

		if (deletedEvents.length === 0) {
			return { success: false, error: "Event not found" }
		}

		revalidateTag("events", "max")
		revalidatePath("/")
		revalidatePath("/eventos")

		return { success: true }
	} catch (error) {
		console.error("Error deleting event:", error)
		return { success: false, error: "Failed to delete event" }
	}
}
