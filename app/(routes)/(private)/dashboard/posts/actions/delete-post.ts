"use server"

import * as z from "zod";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DeletePost(id: string): Promise<boolean> {
  try {
    const deletedPosts = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning();

    return deletedPosts.length > 0;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error);
      return false;
    }
    console.error(error);
    return false;
  }
}