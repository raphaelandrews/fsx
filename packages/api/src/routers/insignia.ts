import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { insignias, insertInsigniaSchema } from "@fsx/db/schema/insignias";
import { adminProcedure, publicProcedure, router } from "../index";

export const insigniaRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(insignias).orderBy(asc(insignias.level))
  ),
  create: adminProcedure
    .input(insertInsigniaSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(insignias).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().max(80).optional(), level: z.number().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(insignias).set(input).where(eq(insignias.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(insignias).where(eq(insignias.id, input.id))
    ),
});
