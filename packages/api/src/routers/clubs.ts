import { z } from "zod";
import { eq, asc, desc } from "drizzle-orm";

import { clubs, insertClubSchema } from "@fsx/db/schema/clubs";
import { players } from "@fsx/db/schema/players";
import { loadClubStandings } from "../gamification/clubs";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { emblemUrl, idInput, nameText, positiveInt, searchText } from "../input-schemas";
import { assertDeletable } from "../services/delete-impact";
import { deleteMediaUrl, deleteReplacedMedia } from "../services/media-storage";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { matchesAllWords, SEARCH_RESULT_LIMIT, SEARCH_SCAN_LIMIT, searchWords } from "../lib/name-search";

export const clubsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: clubs.id, name: clubs.name, logoUrl: clubs.logoUrl })
      .from(clubs).orderBy(asc(clubs.name), asc(clubs.id)).limit(PUBLIC_COLLECTION_LIMIT)
  ),
  leaderboard: publicProcedure.query(({ ctx }) => loadClubStandings(ctx.db)),
  // One club's row of the leaderboard, for pages that show a single club's standing.
  standing: publicProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => (await loadClubStandings(ctx.db)).find((standing) => standing.club.id === input.id) ?? null),
  byId: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    const [standings, members] = await Promise.all([
      loadClubStandings(ctx.db),
      ctx.db
        .select({
          id: players.id,
          name: players.name,
          nickname: players.nickname,
          imageUrl: players.imageUrl,
          active: players.active,
          classic: players.classic,
          rapid: players.rapid,
          blitz: players.blitz,
        })
        .from(players)
        .where(eq(players.clubId, input.id))
        .orderBy(desc(players.active), desc(players.rapid), asc(players.name))
        .limit(PUBLIC_COLLECTION_LIMIT),
    ]);
    const club = requireFound(
      await ctx.db.query.clubs.findFirst({ where: eq(clubs.id, input.id), columns: { id: true, name: true, logoUrl: true } }),
      "Club",
    );
    return { club, standing: standings.find((standing) => standing.club.id === club.id) ?? null, members };
  }),
  search: publicProcedure
    .input(z.object({ query: searchText }))
    .query(async ({ ctx, input }) => {
      const words = searchWords(input.query);
      const rows = await ctx.db
        .select({ id: clubs.id, name: clubs.name })
        .from(clubs)
        .orderBy(asc(clubs.name), asc(clubs.id))
        .limit(SEARCH_SCAN_LIMIT);
      return rows.filter((club) => matchesAllWords(club.name, words)).slice(0, SEARCH_RESULT_LIMIT);
    }),
  create: adminProcedure
    .input(insertClubSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      logoUrl: emblemUrl("clubs").nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(clubs).values(input).returning()
    ),
  update: adminProcedure
    .input(
      z.object({
        id: positiveInt,
        name: nameText,
        logoUrl: emblemUrl("clubs").nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const previous = await ctx.db.query.clubs.findFirst({
        where: eq(clubs.id, input.id),
        columns: { logoUrl: true },
      });
      const updated = requireMutationRows(
        await ctx.db.update(clubs).set(input).where(eq(clubs.id, input.id)).returning(),
        "Club",
      );
      await deleteReplacedMedia(ctx.db, previous?.logoUrl, input.logoUrl);
      return updated;
    }),
  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await assertDeletable(ctx.db, "club", input.id);
    // Delete the row first: if a foreign key blocks it, the logo must survive.
    const deleted = requireMutationRows(
      await ctx.db
        .delete(clubs)
        .where(eq(clubs.id, input.id))
        .returning({ id: clubs.id, logoUrl: clubs.logoUrl }),
      "Club",
    );
    await deleteMediaUrl(ctx.db, deleted[0]?.logoUrl);
    return deleted.map(({ id }) => ({ id }));
  }),
});
