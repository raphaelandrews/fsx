"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { posts } from "@/db/schema"

export async function updatePostImage(postId: string, imageUrl: string) {
	try {
		const updatedPosts = await db
			.update(posts)
			.set({
				image: imageUrl,
				updatedAt: new Date(),
			})
			.where(eq(posts.id, postId))
			.returning()

		if (updatedPosts.length === 0) {
			return { success: false, error: "Post not found" }
		}

		const updatedPost = updatedPosts[0]

		revalidateTag(`post-${postId}`, "max")
		revalidateTag("posts", "max")
		revalidateTag("fresh-posts", "max")
		revalidatePath("/")
		revalidatePath(`/noticias/${updatedPost.slug}`)
		revalidatePath("/noticias")
		revalidatePath(`/private/dashboard/posts/${postId}`)
		revalidatePath("/private/dashboard/posts")

		return { success: true, data: updatedPost }
	} catch (error) {
		console.error("Error updating post image:", error)
		return { success: false, error: "Failed to update post image" }
	}
}
