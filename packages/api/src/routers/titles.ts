import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { titles, insertTitleSchema } from "@fsx/db/schema/titles";
import { adminProcedure, publicProcedure, router } from "../index";
import { nameText, positiveInt } from "../input-schemas";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

export const titlesRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: titles.id, name: titles.name, shortName: titles.shortName, type: titles.type })
      .from(titles).orderBy(asc(titles.name), asc(titles.id)).limit(PUBLIC_COLLECTION_LIMIT)
  ),
  create: adminProcedure
    .input(insertTitleSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      shortName: z.string().trim().min(1).max(10),
      type: z.enum(["internal", "external"]),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(titles).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
      shortName: z.string().trim().min(1).max(10).optional(),
      type: z.enum(["internal", "external"]).optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(titles).set(input).where(eq(titles.id, input.id)).returning(),
        "Title",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(titles).where(eq(titles.id, input.id)).returning({ id: titles.id }),
        "Title",
      )
    ),
});
