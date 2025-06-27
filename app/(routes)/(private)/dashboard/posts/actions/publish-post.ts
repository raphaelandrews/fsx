"use server"

import z from "zod"

import { db } from "@/db"
import { posts } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PublishPost(id: string) {
	try {
		const updatedPosts = await db
			.update(posts)
			.set({
				published: true,
			})
			.where(eq(posts.id, id))
			.returning()

		if (updatedPosts.length === 0) {
			console.warn(`Post with ID ${id} not found or not updated.`)
			return null
		}

		return updatedPosts[0]
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Validation error:", error.errors)
		} else {
			console.error("Database or unexpected error:", error)
		}
		return null
	}
}
