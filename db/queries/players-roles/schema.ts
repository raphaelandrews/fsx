import { z } from "zod"
import { roleTypeEnum } from "@/db/schema"

const PlayerSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().max(100),
	imageUrl: z.string().url().nullable(),
})

const PlayerToRoleSchema = z.object({
	player: PlayerSchema,
})

const RoleSchema = z.object({
	role: z.string().max(80),
	type: z.enum(roleTypeEnum.enumValues),
	playersToRoles: z.array(PlayerToRoleSchema).default([]),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: z.array(RoleSchema),
})

const ErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.number().int(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
})

export const APIPlayersRolesResponseSchema = z.discriminatedUnion("success", [
	SuccessSchema,
	ErrorSchema,
])

export type PlayerRole = z.infer<typeof RoleSchema>
export type APIPlayersRolesResponse = z.infer<
	typeof APIPlayersRolesResponseSchema
>
