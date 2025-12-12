"use server"

import { revalidateTag } from "next/cache"

export async function revalidateTagAction(tag: string) {
	try {
		revalidateTag(tag, "max")
		return { success: true, message: `Successfully revalidated tag: ${tag}` }
	} catch (error) {
		console.error("Error revalidating tag:", error)
		return { success: false, message: "Failed to revalidate tag" }
	}
}

export async function revalidateMultipleTagsAction(tags: string[]) {
	try {
		tags.forEach((tag) => revalidateTag(tag, "max"))
		return {
			success: true,
			message: `Successfully revalidated ${tags.length} tags`,
		}
	} catch (error) {
		console.error("Error revalidating tags:", error)
		return { success: false, message: "Failed to revalidate tags" }
	}
}
