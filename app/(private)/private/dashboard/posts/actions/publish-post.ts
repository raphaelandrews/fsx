"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"
import z from "zod"

import { db } from "@/db"
import { posts } from "@/db/schema"

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

		const updatedPost = updatedPosts[0]

		revalidateTag(`post-${id}`, "max")
		revalidateTag("posts", "max")
		revalidateTag("fresh-posts", "max")
		revalidatePath("/")
		revalidatePath(`/noticias/${updatedPost.slug}`)
		revalidatePath("/noticias")
		revalidatePath(`/private/dashboard/posts/${id}`)
		revalidatePath("/private/dashboard/posts")

		return updatedPost
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Validation error:", error.errors)
		} else {
			console.error("Database or unexpected error:", error)
		}
		return null
	}
}
