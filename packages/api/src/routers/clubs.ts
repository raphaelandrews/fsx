import { z } from "zod";
import { eq, asc, sql } from "drizzle-orm";

import { clubs, insertClubSchema } from "@fsx/db/schema/clubs";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { emblemUrl, nameText, positiveInt, searchText } from "../input-schemas";
import { deleteMediaUrl } from "./images";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";
import { escapeLike, like } from "../sql-like";

function normalizeClubName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export const clubsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: clubs.id, name: clubs.name, logoUrl: clubs.logoUrl })
      .from(clubs).orderBy(asc(clubs.name), asc(clubs.id)).limit(PUBLIC_COLLECTION_LIMIT)
  ),
  search: publicProcedure
    .input(z.object({ query: searchText }))
    .query(async ({ ctx, input }) => {
      const q = normalizeClubName(input.query);
      const words = q.split(/\s+/).filter(Boolean);
      const rows = await ctx.db
        .select({ id: clubs.id, name: clubs.name })
        .from(clubs)
        .where(words.length ? like(sql`lower(${clubs.name})`, `%${words.map(escapeLike).join("%")}%`) : undefined)
        .orderBy(asc(clubs.name), asc(clubs.id))
        .limit(10);
      return rows;
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
    .input(z.object({ id: positiveInt, name: nameText, logoUrl: emblemUrl("clubs").nullable().optional() }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(clubs).set(input).where(eq(clubs.id, input.id)).returning(),
        "Club",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      // Delete the row first: if a foreign key blocks it, the logo must survive.
      const deleted = requireMutationRows(
        await ctx.db.delete(clubs).where(eq(clubs.id, input.id)).returning({ id: clubs.id, logoUrl: clubs.logoUrl }),
        "Club",
      );
      await deleteMediaUrl(deleted[0]?.logoUrl);
      return deleted.map(({ id }) => ({ id }));
    }),
});
