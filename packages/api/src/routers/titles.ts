import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { titles, insertTitleSchema } from "@fsx/db/schema/titles";
import { adminProcedure, publicProcedure, router } from "../index";

export const titlesRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(titles).orderBy(asc(titles.name))
  ),
  create: adminProcedure
    .input(insertTitleSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(titles).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().max(80).optional(), shortName: z.string().max(10).optional(), type: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(titles).set(input).where(eq(titles.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(titles).where(eq(titles.id, input.id))
    ),
});
