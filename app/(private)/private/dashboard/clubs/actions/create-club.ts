"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { clubs } from "@/db/schema"

interface CreateClubInput {
	name: string
	logo: string | null
}

export async function createClub(input: CreateClubInput) {
	try {
		const newClub = await db
			.insert(clubs)
			.values({
				name: input.name,
				logo: input.logo,
			})
			.returning()

		revalidateTag("clubs", "max")
		revalidatePath("/")
		revalidatePath("/ratings")
		revalidatePath("/private/dashboard/clubs")

		return { success: true, data: newClub[0] }
	} catch (error) {
		console.error("Error creating club:", error)
		return { success: false, error: "Failed to create club" }
	}
}
