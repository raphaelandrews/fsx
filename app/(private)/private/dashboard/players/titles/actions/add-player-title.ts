"use server"

import { revalidateTag } from "next/cache"

import { db } from "@/db"
import { playersToTitles } from "@/db/schema"
import { withSequenceFix } from "@/lib/with-sequence-fix"

export async function addPlayerTitle(playerId: number, titleId: number) {
	try {
		await withSequenceFix("players_to_titles", () =>
			db.insert(playersToTitles).values({ playerId, titleId }).returning()
		)

		revalidateTag("players", "default")
		revalidateTag("titled-players", "default")

		return { success: true }
	} catch (error) {
		console.error("Error adding player title:", error)
		return { success: false, error: "Failed to add title" }
	}
}
