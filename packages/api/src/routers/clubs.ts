import { z } from "zod";
import { eq, asc, sql } from "drizzle-orm";

import { clubs, insertClubSchema } from "@fsx/db/schema/clubs";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { nameText, positiveInt, searchText, urlText } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

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
        .where(words.length ? sql`lower(${clubs.name}) LIKE ${`%${words.join("%")}%`}` : undefined)
        .orderBy(asc(clubs.name), asc(clubs.id))
        .limit(10);
      return rows;
    }),
  create: adminProcedure
    .input(insertClubSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      logoUrl: urlText.nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(clubs).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: positiveInt, name: nameText, logoUrl: urlText.nullable().optional() }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(clubs).set(input).where(eq(clubs.id, input.id)).returning(),
        "Club",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(clubs).where(eq(clubs.id, input.id)).returning({ id: clubs.id }),
        "Club",
      )
    ),
});
