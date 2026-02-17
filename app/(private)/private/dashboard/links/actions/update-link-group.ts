"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { linkGroups } from "@/db/schema"

interface UpdateLinkGroupInput {
	id: number
	label: string
}

export async function updateLinkGroup(input: UpdateLinkGroupInput) {
	try {
		const updatedLinkGroups = await db
			.update(linkGroups)
			.set({
				label: input.label,
			})
			.where(eq(linkGroups.id, input.id))
			.returning()

		if (updatedLinkGroups.length === 0) {
			return { success: false, error: "Link group not found" }
		}

		revalidateTag("link-groups", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/link-groups")

		return { success: true, data: updatedLinkGroups[0] }
	} catch (error) {
		console.error("Error updating link group:", error)
		return { success: false, error: "Failed to update link group" }
	}
}
