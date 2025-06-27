import { z } from "zod"

const FreshPostSchema = z.object({
	id: z.string(),
	title: z.string().max(80),
	image: z.string(),
	slug: z.string(),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: z.array(FreshPostSchema),
})

const ErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.number().int(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
})

export const APIFreshPostsResponseSchema = z.discriminatedUnion("success", [
	SuccessSchema,
	ErrorSchema,
])

export type FreshPost = z.infer<typeof FreshPostSchema>
export type APIFreshPostsResponse = z.infer<typeof APIFreshPostsResponseSchema>
