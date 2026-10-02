import { asc, desc, eq } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { players } from "@fsx/db/schema/players";
import { announcements } from "@fsx/db/schema/announcements";
import { posts } from "@fsx/db/schema/posts";
import { env } from "@fsx/env/server";

import { PUBLIC_COLLECTION_LIMIT } from "./resource-bounds";

// Server-only: deliberately not a tRPC procedure, so anonymous clients cannot
// pull thousands of IDs straight from D1 through /api/trpc.
export async function getSitemapEntries(db = createDb(env.DB)) {
  const [publishedPosts, activePlayers, publishedAnnouncements] = await Promise.all([
    db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.updatedAt), desc(posts.id))
      .limit(PUBLIC_COLLECTION_LIMIT * 20),
    db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.active, true))
      .orderBy(asc(players.id))
      .limit(PUBLIC_COLLECTION_LIMIT * 20),
    db
      .select({ id: announcements.id })
      .from(announcements)
      .orderBy(asc(announcements.id))
      .limit(PUBLIC_COLLECTION_LIMIT * 20),
  ]);

  return {
    posts: publishedPosts,
    playerIds: activePlayers.map(({ id }) => id),
    announcementIds: publishedAnnouncements.map(({ id }) => id),
  };
}
