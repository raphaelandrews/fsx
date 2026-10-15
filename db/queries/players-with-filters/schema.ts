import { z } from "zod"
import { titleTypeEnum } from "@/db/schema"

const PlayerQuerySchema = z.object({
	group: z.enum(["U10", "U12", "U14", "U16", "U18"]).optional(),
	sortBy: z.enum(["rapid", "blitz", "classic"]).optional(),
	page: z.string().transform(Number).optional(),
	perPage: z.string().transform(Number).optional(),
})

const TitleSchema = z.object({
	title: z.object({
		title: z.string().max(40),
		shortTitle: z.string().max(4),
		type: z.enum(titleTypeEnum.enumValues),
	}),
})

const LocationSchema = z.object({
	name: z.string().max(80),
	flag: z.string().nullable(),
})

const ClubSchema = z.object({
	id: z.number().int(),
	name: z.string().max(80),
	logo: z.string().nullable(),
})

const ChampionshipSchema = z.object({
	championship: z.object({
		name: z.string().max(80),
	}),
})

const PlayerWithFiltersSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().max(100),
	nickname: z.string().max(20).nullable(),
	blitz: z.number().int().min(0).default(1900),
	rapid: z.number().int().min(0).default(1900),
	classic: z.number().int().min(0).default(1900),
	imageUrl: z.string().url().nullable(),
	birth: z.union([z.date(), z.string()]).nullable(),
	sex: z.boolean().default(false),
	club: ClubSchema.nullable(),
	location: LocationSchema.nullable(),
	defendingChampions: z.array(ChampionshipSchema).default([]),
	playersToTitles: z.array(TitleSchema).default([]),
})

const PaginationSchema = z.object({
	currentPage: z.number().int().positive(),
	totalPages: z.number().int().positive(),
	totalItems: z.number().int().nonnegative(),
	itemsPerPage: z.number().int().positive(),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
	sortBy: z.enum(["rapid", "blitz", "classic"]).default("rapid"),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: z.object({
		players: z.array(PlayerWithFiltersSchema),
		pagination: PaginationSchema,
	}),
})

const ErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.number().int(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
})

export const APIPlayersWithFiltersResponseSchema = z.discriminatedUnion(
	"success",
	[SuccessSchema, ErrorSchema]
)

export type PlayerWithFilters = z.infer<typeof PlayerWithFiltersSchema>
export type PlayerQueryParams = z.infer<typeof PlayerQuerySchema>
export type APIPlayersWithFiltersResponse = z.infer<
	typeof APIPlayersWithFiltersResponseSchema
>
