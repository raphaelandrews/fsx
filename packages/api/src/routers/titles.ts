import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { titles, insertTitleSchema } from "@fsx/db/schema/titles";
import { protectedProcedure, publicProcedure, router } from "../index";

export const titlesRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(titles).orderBy(asc(titles.title))
  ),
  create: protectedProcedure
    .input(insertTitleSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(titles).values(input).returning()
    ),
  update: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string().max(80).optional(), shortTitle: z.string().max(10).optional(), type: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(titles).set(input).where(eq(titles.id, input.id)).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(titles).where(eq(titles.id, input.id))
    ),
});
