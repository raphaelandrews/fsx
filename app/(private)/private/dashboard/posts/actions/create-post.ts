"use server"

import z from "zod"
import { nanoid } from "nanoid"

import { db } from "@/db"
import { posts } from "@/db/schema"

function sanitizeTitle(title: string): string {
	return title.trimStart().replace(/\s{2,}/g, " ")
}

export async function CreatePost(title: string) {
	try {
		const newPostId = nanoid()
		const sanitizedTitle = sanitizeTitle(title)

		const insertedPosts = await db
			.insert(posts)
			.values({
				id: newPostId,
				title: sanitizedTitle,
				content: "",
				image: "",
				slug: "",
				published: false,
			})
			.returning()

		if (insertedPosts.length === 0) {
			console.error(
				"Insert returned no rows. Post might not have been created."
			)
			return null
		}

		return insertedPosts[0]
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Validation error:", error.errors)
		} else {
			console.error("Database or unexpected error:", error)
		}
		return null
	}
}
