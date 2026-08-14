import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { clubs, insertClubSchema } from "@fsx/db/schema/clubs";
import { adminProcedure, publicProcedure, router } from "../index";

export const clubsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: clubs.id, name: clubs.name, logoUrl: clubs.logoUrl })
      .from(clubs).orderBy(asc(clubs.name))
  ),
  create: adminProcedure
    .input(insertClubSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(clubs).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().max(80), logoUrl: z.string().nullable().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(clubs).set(input).where(eq(clubs.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(clubs).where(eq(clubs.id, input.id))
    ),
});
