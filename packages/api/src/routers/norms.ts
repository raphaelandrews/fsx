import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { norms, insertNormSchema } from "@fsx/db/schema/norms";
import { protectedProcedure, publicProcedure, router } from "../index";

export const normsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(norms).orderBy(asc(norms.norm))
  ),
  create: protectedProcedure
    .input(insertNormSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(norms).values(input).returning()
    ),
  update: protectedProcedure
    .input(z.object({ id: z.number(), norm: z.string().max(80) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(norms).set(input).where(eq(norms.id, input.id)).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(norms).where(eq(norms.id, input.id))
    ),
});
