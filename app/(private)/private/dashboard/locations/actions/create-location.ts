"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { locations } from "@/db/schema"
import { withSequenceFix } from "@/lib/with-sequence-fix"

interface CreateLocationInput {
	name: string
	type: "city" | "state" | "country"
	flag: string | null
}

export async function createLocation(input: CreateLocationInput) {
	try {
		const newLocation = await withSequenceFix("locations", () =>
			db
				.insert(locations)
				.values({
					name: input.name,
					type: input.type,
					flag: input.flag,
				})
				.returning()
		)

		revalidateTag("locations", "default")
		revalidatePath("/")
		revalidatePath("/ratings")
		revalidatePath("/private/dashboard/locations")

		return { success: true, data: newLocation[0] }
	} catch (error) {
		console.error("Error creating location:", error)
		return { success: false, error: "Failed to create location" }
	}
}
