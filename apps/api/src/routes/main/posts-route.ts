import { Hono } from "hono";
import { eq, desc } from 'drizzle-orm';

import { db } from "@/src/db";
import { posts } from "@/src/db/schema";

const postsRoute = new Hono();

postsRoute.get("/last-posts", async (c) => {
  const lastPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      image: posts.image,
    })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt))
    .limit(6)
  return c.json(lastPosts);
})

export default postsRoute;
