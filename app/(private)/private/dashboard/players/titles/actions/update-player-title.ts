"use server"

import { revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { playersToTitles } from "@/db/schema"

export async function updatePlayerTitle(relationId: number, newTitleId: number) {
	try {
		const updated = await db
			.update(playersToTitles)
			.set({ titleId: newTitleId })
			.where(eq(playersToTitles.id, relationId))
			.returning()

		if (updated.length === 0) {
			return { success: false, error: "Title relation not found" }
		}

		revalidateTag("players", "default")
		revalidateTag("titled-players", "default")

		return { success: true }
	} catch (error) {
		console.error("Error updating player title:", error)
		return { success: false, error: "Failed to update title" }
	}
}
