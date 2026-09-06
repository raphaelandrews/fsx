import { count } from "drizzle-orm";

import { announcements } from "@fsx/db/schema/announcements";
import { circuits } from "@fsx/db/schema/circuits";
import { clubs } from "@fsx/db/schema/clubs";
import { events } from "@fsx/db/schema/events";
import { players } from "@fsx/db/schema/players";
import { posts } from "@fsx/db/schema/posts";
import { tournaments } from "@fsx/db/schema/tournaments";
import { tvSergipe } from "@fsx/db/schema/tvSergipe";
import { adminProcedure, router } from "../index";

// Lightweight aggregate counts for the admin dashboard. The dashboard only
// shows "how many" per module, so loading full lists (players with all their
// relations, etc.) just to read `.length` was the main source of D1 reads on
// the admin pages.
export const statsRouter = router({
  counts: adminProcedure.query(async ({ ctx }) => {
    const [playersCount, postsCount, announcementsCount, eventsCount, tournamentsCount, circuitsCount, tvSergipeCount, clubsCount] =
      await Promise.all([
        ctx.db.select({ value: count() }).from(players),
        ctx.db.select({ value: count() }).from(posts),
        ctx.db.select({ value: count() }).from(announcements),
        ctx.db.select({ value: count() }).from(events),
        ctx.db.select({ value: count() }).from(tournaments),
        ctx.db.select({ value: count() }).from(circuits),
        ctx.db.select({ value: count() }).from(tvSergipe),
        ctx.db.select({ value: count() }).from(clubs),
      ]);
    return {
      players: playersCount[0]?.value ?? 0,
      posts: postsCount[0]?.value ?? 0,
      announcements: announcementsCount[0]?.value ?? 0,
      events: eventsCount[0]?.value ?? 0,
      tournaments: tournamentsCount[0]?.value ?? 0,
      circuits: circuitsCount[0]?.value ?? 0,
      tvSergipe: tvSergipeCount[0]?.value ?? 0,
      clubs: clubsCount[0]?.value ?? 0,
    };
  }),
});
