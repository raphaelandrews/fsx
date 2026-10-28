import { sql } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

import { announcements } from "@fsx/db/schema/announcements";
import { circuits } from "@fsx/db/schema/circuits";
import { clubs } from "@fsx/db/schema/clubs";
import { events } from "@fsx/db/schema/events";
import { players } from "@fsx/db/schema/players";
import { playerUpdateRequests } from "@fsx/db/schema/player-update-requests";
import { posts } from "@fsx/db/schema/posts";
import { tournaments } from "@fsx/db/schema/tournaments";
import { tvSergipe } from "@fsx/db/schema/tv-sergipe";
import { adminProcedure, router } from "../index";

const total = (table: SQLiteTable) => sql<number>`(select count(*) from ${table})`;

// Only "how many" per module: loading full lists to read `.length` was the main
// source of D1 reads on the admin pages. One statement, not one per module.
export const statsRouter = router({
  counts: adminProcedure.query(async ({ ctx }) => {
    const [counts] = await ctx.db
      .select({
        players: total(players),
        posts: total(posts),
        announcements: total(announcements),
        events: total(events),
        tournaments: total(tournaments),
        circuits: total(circuits),
        tvSergipe: total(tvSergipe),
        clubs: total(clubs),
        pendingRequests: sql<number>`(select count(*) from ${playerUpdateRequests} where ${playerUpdateRequests.status} = 'pending')`,
        draftPosts: sql<number>`(select count(*) from ${posts} where ${posts.published} = 0)`,
        openCircuits: sql<number>`(select count(*) from ${circuits} where ${circuits.finishedAt} is null)`,
      })
      .from(sql`(select 1)`);
    return counts!;
  }),
});
