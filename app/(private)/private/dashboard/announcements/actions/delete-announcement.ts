"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { announcements } from "@/db/schema"

export async function deleteAnnouncement(id: number) {
	try {
		const deletedAnnouncements = await db
			.delete(announcements)
			.where(eq(announcements.id, id))
			.returning()

		if (deletedAnnouncements.length === 0) {
			return { success: false, error: "Announcement not found" }
		}

		revalidateTag("announcements", "max")
		revalidateTag("fresh-announcements", "max")
		revalidatePath("/")
		revalidatePath("/comunicados")

		return { success: true }
	} catch (error) {
		console.error("Error deleting announcement:", error)
		return { success: false, error: "Failed to delete announcement" }
	}
}
