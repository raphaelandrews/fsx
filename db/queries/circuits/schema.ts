import { z } from "zod"
import {
	circuitCategoryEnum,
	circuitPlaceEnum,
	circuitTypeEnum,
	titleTypeEnum,
} from "@/db/schema"

const TitleSchema = z.object({
	title: z.object({
		shortTitle: z.string().max(4),
		type: z.enum(titleTypeEnum.enumValues),
	}),
})

const ClubSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().max(80),
	logo: z.string().nullable(),
})

const PlayerSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().max(100),
	nickname: z.string().max(20).nullable(),
	imageUrl: z.string().url().nullable(),
	club: ClubSchema.nullable(),
	playersToTitles: z.array(TitleSchema).default([]),
})

const CircuitPodiumSchema = z.object({
	category: z.enum(circuitCategoryEnum.enumValues).nullable(),
	place: z.enum(circuitPlaceEnum.enumValues),
	points: z.number(),
	player: PlayerSchema,
})

const TournamentSchema = z.object({
	name: z.string().max(80),
})

const CircuitPhaseSchema = z.object({
	id: z.number().int().positive(),
	order: z.number(),
	tournament: TournamentSchema,
	circuitPodiums: z.array(CircuitPodiumSchema),
})

const CircuitSchema = z.object({
	name: z.string().max(80),
	type: z.enum(circuitTypeEnum.enumValues),
	circuitPhase: z.array(CircuitPhaseSchema),
})

export const APICircuitsResponseSchema = z.discriminatedUnion("success", [
	z.object({
		success: z.literal(true),
		data: z.array(CircuitSchema),
	}),
	z.object({
		success: z.literal(false),
		error: z.object({
			code: z.number(),
			message: z.string(),
			details: z.any().optional(),
		}),
	}),
])

export type Circuit = z.infer<typeof CircuitSchema>
export type APICircuitsResponse = z.infer<typeof APICircuitsResponseSchema>
