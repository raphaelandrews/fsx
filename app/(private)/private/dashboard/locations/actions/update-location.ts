"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { locations } from "@/db/schema"

interface UpdateLocationInput {
	id: number
	name: string
	type: "city" | "state" | "country"
	flag: string | null
}

export async function updateLocation(input: UpdateLocationInput) {
	try {
		const updatedLocations = await db
			.update(locations)
			.set({
				name: input.name,
				type: input.type,
				flag: input.flag || null,
			})
			.where(eq(locations.id, input.id))
			.returning()

		if (updatedLocations.length === 0) {
			return { success: false, error: "Location not found" }
		}

		revalidateTag("locations", "max")
		revalidatePath("/")
		revalidatePath("/ratings")
		revalidatePath("/private/dashboard/locations")

		return { success: true, data: updatedLocations[0] }
	} catch (error) {
		console.error("Error updating location:", error)
		return { success: false, error: "Failed to update location" }
	}
}
