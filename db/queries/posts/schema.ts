import { z } from "zod"

const PostsSchema = z.object({
	id: z.string(),
	title: z.string().max(80),
	image: z.string(),
	slug: z.string(),
	createdAt: z.union([z.date(), z.string()]),
	published: z.boolean().optional(),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: z.array(PostsSchema),
})

const ErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.number().int(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
})

export const APIPostsResponseSchema = z.discriminatedUnion("success", [
	SuccessSchema,
	ErrorSchema,
])

export type Posts = z.infer<typeof PostsSchema>
export type APIPostsResponse = z.infer<typeof APIPostsResponseSchema>
