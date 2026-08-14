import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { norms, insertNormSchema } from "@fsx/db/schema/norms";
import { adminProcedure, publicProcedure, router } from "../index";

export const normsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(norms).orderBy(asc(norms.name))
  ),
  create: adminProcedure
    .input(insertNormSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(norms).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().max(80) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(norms).set(input).where(eq(norms.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(norms).where(eq(norms.id, input.id))
    ),
});
