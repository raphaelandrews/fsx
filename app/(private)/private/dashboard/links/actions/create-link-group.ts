"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { linkGroups } from "@/db/schema"

interface CreateLinkGroupInput {
	label: string
}

export async function createLinkGroup(input: CreateLinkGroupInput) {
	try {
		const newLinkGroup = await db
			.insert(linkGroups)
			.values({
				label: input.label,
			})
			.returning()

		revalidateTag("link-groups", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/link-groups")

		return { success: true, data: newLinkGroup[0] }
	} catch (error) {
		console.error("Error creating link group:", error)
		return { success: false, error: "Failed to create link group" }
	}
}
