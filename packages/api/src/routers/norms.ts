import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { norms, insertNormSchema } from "@fsx/db/schema/norms";
import { adminProcedure, publicProcedure, router } from "../index";
import { idInput, nameText, positiveInt } from "../input-schemas";
import { deleteById } from "../crud";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";

export const normsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: norms.id, name: norms.name })
      .from(norms).orderBy(asc(norms.name), asc(norms.id)).limit(PUBLIC_COLLECTION_LIMIT)
  ),
  create: adminProcedure
    .input(insertNormSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({ name: nameText }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(norms).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: positiveInt, name: nameText }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(norms).set(input).where(eq(norms.id, input.id)).returning(),
        "Norm",
      )
    ),
  delete: adminProcedure
    .input(idInput)
    .mutation(({ ctx, input }) => deleteById(ctx.db, norms, input.id, "Norm")),
});
