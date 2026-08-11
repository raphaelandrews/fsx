import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { clubs, insertClubSchema } from "@fsx/db/schema/clubs";
import { protectedProcedure, publicProcedure, router } from "../index";

export const clubsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: clubs.id, name: clubs.name, logo: clubs.logo })
      .from(clubs).orderBy(asc(clubs.name))
  ),
  create: protectedProcedure
    .input(insertClubSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(clubs).values(input).returning()
    ),
  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().max(80), logo: z.string().nullable().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(clubs).set(input).where(eq(clubs.id, input.id)).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(clubs).where(eq(clubs.id, input.id))
    ),
});
