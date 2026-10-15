import { z } from "zod"

const AnnouncementByPageSchema = z.object({
	id: z.number().int().positive(),
	year: z.number().int(),
	number: z.string().max(3),
	content: z.string(),
})

const PaginationSchema = z.object({
	currentPage: z.number().int().positive(),
	totalPages: z.number().int().positive(),
	totalItems: z.number().int().nonnegative(),
	itemsPerPage: z.number().int().positive(),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: z.object({
		announcements: z.array(AnnouncementByPageSchema),
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

export const APIAnnouncementsResponseSchema = z.discriminatedUnion("success", [
	SuccessSchema,
	ErrorSchema,
])

export type AnnouncementByPage = z.infer<typeof AnnouncementByPageSchema>
export type APIAnnouncementsResponse = z.infer<
	typeof APIAnnouncementsResponseSchema
>
