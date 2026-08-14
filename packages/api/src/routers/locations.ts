import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { locations, insertLocationSchema } from "@fsx/db/schema/locations";
import { adminProcedure, publicProcedure, router } from "../index";

export const locationsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: locations.id, name: locations.name, type: locations.type, flagUrl: locations.flagUrl })
      .from(locations).orderBy(asc(locations.name))
  ),
  create: adminProcedure
    .input(insertLocationSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(locations).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().max(80), type: z.string(), flagUrl: z.string().nullable().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(locations).set(input).where(eq(locations.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(locations).where(eq(locations.id, input.id))
    ),
});
