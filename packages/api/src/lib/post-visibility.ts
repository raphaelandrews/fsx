import { and, eq, sql } from "drizzle-orm";

import { posts } from "@fsx/db/schema/posts";

// Public reads filter on the clock instead of a cron job: a scheduled post becomes visible as soon as the
// time passes, after the cached responses expire.
export const publiclyVisiblePost = () =>
  and(eq(posts.published, true), sql`(${posts.publishAt} IS NULL OR ${posts.publishAt} <= CURRENT_TIMESTAMP)`);

const DB_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/;

export function toDbTimestamp(isoInstant: string): string {
  const match = DB_TIMESTAMP.exec(new Date(isoInstant).toISOString());
  return `${match![1]} ${match![2]}`;
}
