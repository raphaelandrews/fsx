"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { announcements } from "@/db/schema"

interface UpdateAnnouncementInput {
	id: number
	year: number
	number: string
	content: string
}

export async function updateAnnouncement(input: UpdateAnnouncementInput) {
	try {
		const updatedAnnouncements = await db
			.update(announcements)
			.set({
				year: input.year,
				number: input.number,
				content: input.content,
			})
			.where(eq(announcements.id, input.id))
			.returning()

		if (updatedAnnouncements.length === 0) {
			return { success: false, error: "Announcement not found" }
		}

		revalidateTag("announcements", "max")
		revalidateTag("fresh-announcements", "max")
		revalidatePath("/")
		revalidatePath("/comunicados")

		return { success: true, data: updatedAnnouncements[0] }
	} catch (error) {
		console.error("Error updating announcement:", error)
		return { success: false, error: "Failed to update announcement" }
	}
}
