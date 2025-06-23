"use server";

import { eq } from "drizzle-orm";
import z from "zod";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { PostBySlug } from "@/db/queries";

export async function UpdatePost(post: PostBySlug) {
  try {
    const updatedPosts = await db
      .update(posts)
      .set({
        title: post.title,
        slug: post.slug,
        image: post.image,
        content: post.content,
      })
      .where(eq(posts.id, post.id))
      .returning();

    if (updatedPosts.length === 0) {
      console.warn(`Post with ID ${post.id} not found or no changes made.`);
      return null;
    }

    return updatedPosts[0];

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error during post update:", error.errors);
    } else {
      console.error("Database or unexpected error during post update:", error);
    }
    return null;
  }
}
