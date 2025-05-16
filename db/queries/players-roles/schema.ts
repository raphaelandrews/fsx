import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players, roles, roleTypeEnum } from "@/db/schema";

const roleSchema = createSelectSchema(roles);
const playerSchema = createSelectSchema(players);

const playerToRoleSchema = z.object({
  player: playerSchema.pick({ id: true, name: true, imageUrl: true }),
});

export const PlayerToRoleSchema = roleSchema
  .pick({
    role: true,
    type: true,
  })
  .extend({
    role: z.string().max(80, "Role must be 80 characters or less"),
    type: z.enum(roleTypeEnum.enumValues),
    playersToRoles: z.array(playerToRoleSchema).optional(),
  });

export const SuccessPlayerToRolesSchema = z.object({
  success: z.literal(true),
  data: z.array(PlayerToRoleSchema),
});

const ErrorPlayerToRolesSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APIPlayerToRolesResponseSchema = z.discriminatedUnion("success", [
  SuccessPlayerToRolesSchema,
  ErrorPlayerToRolesSchema,
]);

export type PlayerToRole = z.infer<typeof PlayerToRoleSchema>;
export type SuccessPlayerToRolesResponse = z.infer<typeof SuccessPlayerToRolesSchema>["data"];
export type APIPlayerToRolesResponse = z.infer<typeof APIPlayerToRolesResponseSchema>;
