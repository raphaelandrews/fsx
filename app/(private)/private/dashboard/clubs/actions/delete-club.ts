"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { clubs } from "@/db/schema"

export async function deleteClub(id: number) {
	try {
		const deletedClubs = await db
			.delete(clubs)
			.where(eq(clubs.id, id))
			.returning()

		if (deletedClubs.length === 0) {
			return { success: false, error: "Club not found" }
		}

		revalidateTag("clubs", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/clubs")

		return { success: true }
	} catch (error) {
		console.error("Error deleting club:", error)
		return { success: false, error: "Failed to delete club" }
	}
}
