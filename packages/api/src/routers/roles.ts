import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { roles, insertRoleSchema } from "@fsx/db/schema/roles";
import { adminProcedure, publicProcedure, router } from "../index";
import { nameText, positiveInt } from "../input-schemas";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

const roleTypeEnum = z.enum(["management", "referee", "teacher"]);

export const rolesRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: roles.id, name: roles.name, shortName: roles.shortName, type: roles.type }).from(roles).orderBy(asc(roles.name), asc(roles.id)).limit(PUBLIC_COLLECTION_LIMIT)
  ),
  listWithPlayers: publicProcedure.query(({ ctx }) =>
    ctx.db.query.roles.findMany({
      with: {
          playersToRoles: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
          fields: ["playerId", "roleId"],
          with: {
            player: { columns: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  create: adminProcedure
    .input(insertRoleSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      shortName: z.string().trim().min(1).max(4),
      type: roleTypeEnum,
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(roles).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
      shortName: z.string().trim().min(1).max(4).optional(),
      type: roleTypeEnum.optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(roles).set(input).where(eq(roles.id, input.id)).returning(),
        "Role",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(roles).where(eq(roles.id, input.id)).returning({ id: roles.id }),
        "Role",
      )
    ),
});
