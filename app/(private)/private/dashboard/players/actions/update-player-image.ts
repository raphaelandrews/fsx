"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { players } from "@/db/schema"

export async function updatePlayerImage(playerId: number, imageUrl: string | null) {
	try {
		const updatedPlayers = await db
			.update(players)
			.set({
				imageUrl: imageUrl || null,
				updatedAt: new Date(),
			})
			.where(eq(players.id, playerId))
			.returning()

		if (updatedPlayers.length === 0) {
			return { success: false, error: "Player not found" }
		}

		revalidateTag(`player-${playerId}`, "max")
		revalidateTag("players", "max")
		revalidateTag("swiss-manager-export", "max")
		revalidatePath("/")
		revalidatePath(`/jogadores/${playerId}`)
		revalidatePath("/ratings")
		revalidatePath("/titulados")
		revalidatePath(`/private/dashboard/players/${playerId}`)

		return { success: true, data: updatedPlayers[0] }
	} catch (error) {
		console.error("Error updating player image:", error)
		return { success: false, error: "Failed to update player image" }
	}
}
