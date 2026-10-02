import { asc, desc, eq } from "drizzle-orm";

import { players } from "@fsx/db/schema/players";
import { posts } from "@fsx/db/schema/posts";
import { publicProcedure, router } from "../index";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

export const sitemapRouter = router({
  entries: publicProcedure.query(async ({ ctx }) => {
    const [publishedPosts, activePlayers] = await Promise.all([
      ctx.db
        .select({ slug: posts.slug, updatedAt: posts.updatedAt })
        .from(posts)
        .where(eq(posts.published, true))
        .orderBy(desc(posts.updatedAt), desc(posts.id))
        .limit(PUBLIC_COLLECTION_LIMIT * 20),
      ctx.db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.active, true))
        .orderBy(asc(players.id))
        .limit(PUBLIC_COLLECTION_LIMIT * 20),
    ]);

    return {
      posts: publishedPosts,
      playerIds: activePlayers.map(({ id }) => id),
    };
  }),
});
