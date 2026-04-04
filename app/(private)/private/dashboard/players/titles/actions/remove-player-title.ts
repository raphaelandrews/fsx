"use server"

import { revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { playersToTitles } from "@/db/schema"

export async function removePlayerTitle(relationId: number) {
	try {
		const deleted = await db
			.delete(playersToTitles)
			.where(eq(playersToTitles.id, relationId))
			.returning()

		if (deleted.length === 0) {
			return { success: false, error: "Title relation not found" }
		}

		revalidateTag("players", "default")
		revalidateTag("titled-players", "default")

		return { success: true }
	} catch (error) {
		console.error("Error removing player title:", error)
		return { success: false, error: "Failed to remove title" }
	}
}
