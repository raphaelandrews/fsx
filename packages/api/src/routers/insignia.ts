import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { insignias, insertInsigniaSchema } from "@fsx/db/schema/insignias";
import { adminProcedure, publicProcedure, router } from "../index";
import { nameText, positiveInt } from "../input-schemas";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

export const insigniaRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(insignias).orderBy(asc(insignias.level), asc(insignias.id)).limit(PUBLIC_COLLECTION_LIMIT)
  ),
  create: adminProcedure
    .input(insertInsigniaSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({ name: nameText, level: positiveInt.max(100) }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(insignias).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: positiveInt, name: nameText.optional(), level: positiveInt.max(100).optional() }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(insignias).set(input).where(eq(insignias.id, input.id)).returning(),
        "Insignia",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(insignias).where(eq(insignias.id, input.id)).returning({ id: insignias.id }),
        "Insignia",
      )
    ),
});
