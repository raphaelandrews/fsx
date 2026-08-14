import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { events, insertEventSchema } from "@fsx/db/schema/events";
import { adminProcedure, publicProcedure, router } from "../index";

export const eventsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(events).orderBy(asc(events.startDate))
  ),
  create: adminProcedure
    .input(insertEventSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(events).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      chessResults: z.string().nullable().optional(),
      startDate: z.string().optional(),
      endDate: z.string().nullable().optional(),
      regulation: z.string().nullable().optional(),
      form: z.string().nullable().optional(),
      type: z.string().optional(),
      timeControl: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(events).set(input).where(eq(events.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(events).where(eq(events.id, input.id))
    ),
});
