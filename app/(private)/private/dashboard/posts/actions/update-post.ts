"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import z from "zod"

import { db } from "@/db"
import { posts } from "@/db/schema"

interface UpdatePostInput {
	id: string
	title: string
	slug: string
	image: string
	content: string
}

function sanitizeTitle(title: string): string {
	return title.trimStart().replace(/\s{2,}/g, " ")
}

export async function UpdatePost(post: UpdatePostInput) {
	try {
		const sanitizedTitle = sanitizeTitle(post.title)

		const updatedPosts = await db
			.update(posts)
			.set({
				title: sanitizedTitle,
				slug: post.slug,
				image: post.image,
				content: post.content,
				updatedAt: new Date(),
			})
			.where(eq(posts.id, post.id))
			.returning()

		if (updatedPosts.length === 0) {
			console.warn(`Post with ID ${post.id} not found or no changes made.`)
			return null
		}

		const updatedPost = updatedPosts[0]

		revalidatePath("/")
		revalidatePath(`/noticias/${updatedPost.slug}`)
		revalidatePath("/noticias")
		revalidatePath("/private/dashboard/posts")
		revalidatePath(`/private/dashboard/posts/${updatedPost.id}`)

		return updatedPost
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Validation error during post update:", error.errors)
		} else {
			console.error("Database or unexpected error during post update:", error)
		}
		return null
	}
}
