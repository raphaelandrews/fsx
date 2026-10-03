import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { locations, insertLocationSchema } from "@fsx/db/schema/locations";
import { adminProcedure, publicProcedure, router } from "../index";
import { emblemUrl, nameText, positiveInt } from "../input-schemas";
import { deleteMediaUrl } from "./images";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

const locationTypeEnum = z.enum(["city", "state", "country"]);

export const locationsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: locations.id, name: locations.name, type: locations.type, flagUrl: locations.flagUrl })
      .from(locations).orderBy(asc(locations.name), asc(locations.id)).limit(PUBLIC_COLLECTION_LIMIT)
  ),
  create: adminProcedure
    .input(insertLocationSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      type: locationTypeEnum,
      flagUrl: emblemUrl("locations").nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(locations).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: positiveInt, name: nameText, type: locationTypeEnum, flagUrl: emblemUrl("locations").nullable().optional() }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(locations).set(input).where(eq(locations.id, input.id)).returning(),
        "Location",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      // Delete the row first: if a foreign key blocks it, the flag must survive.
      const deleted = requireMutationRows(
        await ctx.db.delete(locations).where(eq(locations.id, input.id)).returning({ id: locations.id, flagUrl: locations.flagUrl }),
        "Location",
      );
      await deleteMediaUrl(deleted[0]?.flagUrl);
      return deleted.map(({ id }) => ({ id }));
    }),
});
