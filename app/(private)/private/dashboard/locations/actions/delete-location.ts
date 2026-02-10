"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { locations } from "@/db/schema"

export async function deleteLocation(id: number) {
	try {
		const deletedLocations = await db
			.delete(locations)
			.where(eq(locations.id, id))
			.returning()

		if (deletedLocations.length === 0) {
			return { success: false, error: "Location not found" }
		}

		revalidateTag("locations", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/locations")

		return { success: true }
	} catch (error) {
		console.error("Error deleting location:", error)
		return { success: false, error: "Failed to delete location" }
	}
}
