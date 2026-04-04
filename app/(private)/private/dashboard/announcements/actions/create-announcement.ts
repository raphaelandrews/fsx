"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { announcements } from "@/db/schema"
import { withSequenceFix } from "@/lib/with-sequence-fix"

interface CreateAnnouncementInput {
	year: number
	number: string
	content: string
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
	try {
		const newAnnouncement = await withSequenceFix("announcements", () =>
			db
				.insert(announcements)
				.values({
					year: input.year,
					number: input.number,
					content: input.content,
				})
				.returning()
		)

		revalidateTag("announcements", "default")
		revalidateTag("fresh-announcements", "default")
		revalidatePath("/")
		revalidatePath("/comunicados")

		return { success: true, data: newAnnouncement[0] }
	} catch (error) {
		console.error("Error creating announcement:", error)
		return { success: false, error: "Failed to create announcement" }
	}
}
