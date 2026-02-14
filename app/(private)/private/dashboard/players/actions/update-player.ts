"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { players } from "@/db/schema"

interface UpdatePlayerInput {
	id: number
	name: string
	imageUrl: string | null
	cbxId: number | null
	fideId: number | null
	birth: Date | null
	sex: boolean
	clubId: number | null
	locationId: number | null
}

export async function updatePlayer(input: UpdatePlayerInput) {
	try {
		const updatedPlayers = await db
			.update(players)
			.set({
				name: input.name,
				imageUrl: input.imageUrl || null,
				cbxId: input.cbxId,
				fideId: input.fideId,
				birth: input.birth,
				sex: input.sex,
				clubId: input.clubId,
				locationId: input.locationId,
				updatedAt: new Date(),
			})
			.where(eq(players.id, input.id))
			.returning()

		if (updatedPlayers.length === 0) {
			return { success: false, error: "Player not found" }
		}

		// Revalidate player pages
		revalidateTag(`player-${input.id}`)
		revalidateTag("players")
		revalidateTag("swiss-manager-export")
		revalidatePath("/")
		revalidatePath(`/jogadores/${input.id}`)
		revalidatePath("/ratings")
		revalidatePath("/titulados")

		return { success: true, data: updatedPlayers[0] }
	} catch (error) {
		console.error("Error updating player:", error)
		return { success: false, error: "Failed to update player" }
	}
}
