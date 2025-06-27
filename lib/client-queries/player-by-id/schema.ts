import { z } from "zod"
import { ratingTypeEnum, roleTypeEnum, titleTypeEnum } from "@/db/schema"

const ClubSchema = z.object({
	name: z.string().max(80),
	logo: z.string().nullable(),
})

const LocationSchema = z.object({
	name: z.string().max(80),
	flag: z.string().nullable(),
})

const ChampionshipSchema = z.object({
	championship: z.object({
		name: z.string().max(80),
	}),
})

const TitleSchema = z.object({
	title: z.object({
		title: z.string().max(40),
		shortTitle: z.string().max(4),
		type: z.enum(titleTypeEnum.enumValues),
	}),
})

const RoleSchema = z.object({
	role: z.object({
		role: z.string().max(80),
		shortRole: z.string().max(4),
		type: z.enum(roleTypeEnum.enumValues),
	}),
})

const TournamentSchema = z.object({
	place: z.number().int(),
	tournament: z.object({
		name: z.string().max(80),
		date: z.union([z.date(), z.string()]).nullable(),
		championshipId: z.number().int().nullable(),
	}),
})

const PlayerTournamentSchema = z.object({
	ratingType: z.enum(ratingTypeEnum.enumValues),
	oldRating: z.number().int(),
	variation: z.number().int(),
	tournament: z.object({
		name: z.string().max(80),
	}),
})

const PlayerByIdSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().max(100),
	nickname: z.string().max(20).nullable(),
	blitz: z.number().int().min(0).default(1900),
	rapid: z.number().int().min(0).default(1900),
	classic: z.number().int().min(0).default(1900),
	imageUrl: z.string().url().nullable(),
	cbxId: z.number().int().nullable(),
	fideId: z.number().int().nullable(),
	active: z.boolean().default(false),
	verified: z.boolean().default(false),
	club: ClubSchema.nullable(),
	location: LocationSchema.nullable(),
	defendingChampions: z.array(ChampionshipSchema).default([]),
	playersToTournaments: z.array(PlayerTournamentSchema).default([]),
	playersToRoles: z.array(RoleSchema).default([]),
	tournamentPodiums: z.array(TournamentSchema).default([]),
	playersToTitles: z.array(TitleSchema).default([]),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: PlayerByIdSchema,
})

const ErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.number().int(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
})

export const APIPlayerByIdResponseSchema = z.discriminatedUnion("success", [
	SuccessSchema,
	ErrorSchema,
])

export type PlayerById = z.infer<typeof PlayerByIdSchema>
export type APIPlayerByIdResponse = z.infer<typeof APIPlayerByIdResponseSchema>
