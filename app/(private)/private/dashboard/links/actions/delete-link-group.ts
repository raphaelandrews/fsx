"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { linkGroups, links } from "@/db/schema"

export async function deleteLinkGroup(id: number) {
	try {
		// First delete all links in the group
		await db.delete(links).where(eq(links.linkGroupId, id))

		// Then delete the group
		const deletedLinkGroups = await db
			.delete(linkGroups)
			.where(eq(linkGroups.id, id))
			.returning()

		if (deletedLinkGroups.length === 0) {
			return { success: false, error: "Link group not found" }
		}

		revalidateTag("link-groups", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/link-groups")

		return { success: true }
	} catch (error) {
		console.error("Error deleting link group:", error)
		return { success: false, error: "Failed to delete link group" }
	}
}
