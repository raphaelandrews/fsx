import { desc, sql } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { announcements } from "@fsx/db/schema/announcements";
import { posts } from "@fsx/db/schema/posts";
import { publiclyVisiblePost } from "../lib/post-visibility";
import { env } from "@fsx/env/server";

export const FEED_ITEMS_PER_KIND = 20;
// A feed entry is a teaser, so the database never has to send a whole article.
const TEASER_CHARS = 1_200;

export interface FeedRow {
  kind: "post" | "announcement";
  id: number;
  title: string;
  /** `/noticias/<slug>` or `/comunicados/<id>`. */
  path: string;
  teaser: string;
  /** D1 `CURRENT_TIMESTAMP` text. */
  createdAt: string;
}

// Server-only, like the sitemap: deliberately not a tRPC procedure.
export async function getFeedRows(db = createDb(env.DB)): Promise<FeedRow[]> {
  const [recentPosts, recentAnnouncements] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        teaser: sql<string>`substr(${posts.content}, 1, ${TEASER_CHARS})`,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(publiclyVisiblePost())
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(FEED_ITEMS_PER_KIND),
    db
      .select({
        id: announcements.id,
        year: announcements.year,
        number: announcements.number,
        teaser: sql<string>`substr(${announcements.content}, 1, ${TEASER_CHARS})`,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .orderBy(desc(announcements.createdAt), desc(announcements.id))
      .limit(FEED_ITEMS_PER_KIND),
  ]);

  return [
    ...recentPosts.map((post): FeedRow => ({
      kind: "post",
      id: post.id,
      title: post.title,
      path: `/noticias/${encodeURIComponent(post.slug)}`,
      teaser: post.teaser,
      createdAt: post.createdAt,
    })),
    ...recentAnnouncements.map((item): FeedRow => ({
      kind: "announcement",
      id: item.id,
      title: `Comunicado ${String(item.number).padStart(3, "0")}/${item.year}`,
      path: `/comunicados/${item.id}`,
      teaser: item.teaser,
      createdAt: item.createdAt,
    })),
  ];
}
