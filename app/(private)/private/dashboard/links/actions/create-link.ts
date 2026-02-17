"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { links } from "@/db/schema"

interface CreateLinkInput {
	href: string
	label: string
	icon: string
	order: number
	linkGroupId: number
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

export async function createLink(input: CreateLinkInput) {
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

		const newLink = await db
			.insert(links)
			.values({
				href: input.href,
				label: input.label,
				icon: input.icon,
				order: input.order,
				linkGroupId: input.linkGroupId,
			})
			.returning()

		revalidateTag("link-groups", "max")
		revalidatePath("/")
		revalidatePath("/private/dashboard/link-groups")

		return { success: true, data: newLink[0] }
	} catch (error) {
		console.error("Error creating link:", error)
		return { success: false, error: "Failed to create link" }
	}
}
