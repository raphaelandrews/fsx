import { z } from "zod"
import { eventTimeControlEnum, eventTypeEnum } from "@/db/schema"

const EventSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().max(80),
	chessResults: z.string().url().nullable(),
	startDate: z.union([z.date(), z.string()]),
	endDate: z.union([z.date(), z.string()]).nullable(),
	regulation: z.string().url().nullable(),
	form: z.string().url().nullable(),
	type: z.enum(eventTypeEnum.enumValues),
	timeControl: z.enum(eventTimeControlEnum.enumValues),
})

export const APIEventsResponseSchema = z.discriminatedUnion("success", [
	z.object({
		success: z.literal(true),
		data: z.array(EventSchema),
	}),
	z.object({
		success: z.literal(false),
		error: z.object({
			code: z.number().int(),
			message: z.string(),
			details: z.unknown().optional(),
		}),
	}),
])

export type Event = z.infer<typeof EventSchema>
export type APIEventsResponse = z.infer<typeof APIEventsResponseSchema>
