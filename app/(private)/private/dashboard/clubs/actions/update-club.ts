"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { clubs } from "@/db/schema"

interface UpdateClubInput {
	id: number
	name: string
	logo: string | null
}

export async function updateClub(input: UpdateClubInput) {
	try {
		const updatedClubs = await db
			.update(clubs)
			.set({
				name: input.name,
				logo: input.logo || null,
			})
			.where(eq(clubs.id, input.id))
			.returning()

		if (updatedClubs.length === 0) {
			return { success: false, error: "Club not found" }
		}

		revalidateTag("clubs", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/clubs")

		return { success: true, data: updatedClubs[0] }
	} catch (error) {
		console.error("Error updating club:", error)
		return { success: false, error: "Failed to update club" }
	}
}
