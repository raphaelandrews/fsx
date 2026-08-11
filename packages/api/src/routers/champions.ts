import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { championships, insertChampionshipSchema } from "@fsx/db/schema/championships";
import { protectedProcedure, publicProcedure, router } from "../index";

export const championsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(championships).orderBy(asc(championships.name))
  ),
  create: protectedProcedure
    .input(insertChampionshipSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(championships).values(input).returning()
    ),
  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(80) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(championships).set({ name: input.name }).where(eq(championships.id, input.id)).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(championships).where(eq(championships.id, input.id))
    ),
});
