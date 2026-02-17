"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { links } from "@/db/schema"

interface UpdateLinkInput {
	id: number
	href: string
	label: string
	icon: string
	order: number
}

function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value)
		return url.protocol === "http:" || url.protocol === "https:"
	} catch {
		return false
	}
}

function isValidSvg(value: string): boolean {
	const trimmed = value.trim()
	return trimmed.startsWith("<svg") && trimmed.endsWith("</svg>")
}

export async function updateLink(input: UpdateLinkInput) {
	try {
		if (!isValidUrl(input.href)) {
			return { success: false, error: "Invalid URL" }
		}

		if (!isValidSvg(input.icon)) {
			return { success: false, error: "Invalid SVG icon" }
		}

		if (!input.label || input.label.length > 50) {
			return { success: false, error: "Label must be between 1-50 characters" }
		}

		if (!Number.isInteger(input.order) || input.order < 1) {
			return { success: false, error: "Order must be a positive integer" }
		}

		const updatedLinks = await db
			.update(links)
			.set({
				href: input.href,
				label: input.label,
				icon: input.icon,
				order: input.order,
			})
			.where(eq(links.id, input.id))
			.returning()

		if (updatedLinks.length === 0) {
			return { success: false, error: "Link not found" }
		}

		revalidateTag("link-groups", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/link-groups")

		return { success: true, data: updatedLinks[0] }
	} catch (error) {
		console.error("Error updating link:", error)
		return { success: false, error: "Failed to update link" }
	}
}
