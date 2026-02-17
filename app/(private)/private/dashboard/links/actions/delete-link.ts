"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { links } from "@/db/schema"

export async function deleteLink(id: number) {
	try {
		const deletedLinks = await db
			.delete(links)
			.where(eq(links.id, id))
			.returning()

		if (deletedLinks.length === 0) {
			return { success: false, error: "Link not found" }
		}

		revalidateTag("link-groups", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/link-groups")

		return { success: true }
	} catch (error) {
		console.error("Error deleting link:", error)
		return { success: false, error: "Failed to delete link" }
	}
}
