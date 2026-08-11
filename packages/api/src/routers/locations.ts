import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { locations, insertLocationSchema } from "@fsx/db/schema/locations";
import { protectedProcedure, publicProcedure, router } from "../index";

export const locationsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: locations.id, name: locations.name, type: locations.type, flag: locations.flag })
      .from(locations).orderBy(asc(locations.name))
  ),
  create: protectedProcedure
    .input(insertLocationSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(locations).values(input).returning()
    ),
  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().max(80), type: z.string(), flag: z.string().nullable().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(locations).set(input).where(eq(locations.id, input.id)).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(locations).where(eq(locations.id, input.id))
    ),
});
