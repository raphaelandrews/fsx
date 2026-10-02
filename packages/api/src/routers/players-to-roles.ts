import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToRoles, insertPlayerToRoleSchema } from "@fsx/db/schema/playersToRoles";
import { adminProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { positiveInt } from "../input-schemas";
import { PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

export const playersToRolesRouter = router({
  listByPlayer: adminProcedure
    .input(z.object({ playerId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToRoles.findMany({
        limit: PUBLIC_NESTED_COLLECTION_LIMIT,
        where: eq(playersToRoles.playerId, input.playerId),
        with: { role: true },
      })
    ),

  link: adminProcedure
    .input(insertPlayerToRoleSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      playerId: positiveInt,
      roleId: positiveInt,
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToRoles).values(input).returning()
    ),

  unlink: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(playersToRoles).where(eq(playersToRoles.id, input.id)).returning({ id: playersToRoles.id }),
        "Player role",
      )
    ),
});
