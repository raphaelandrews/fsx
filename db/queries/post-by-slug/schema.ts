import { z } from "zod"

const PostBySlugSchema = z.object({
	id: z.string(),
	title: z.string().max(80),
	image: z.string(),
	content: z.string(),
	slug: z.string(),
	createdAt: z.union([z.date(), z.string()]),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: PostBySlugSchema,
})

const ErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.number().int(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
})

export const APIPostsBySlugResponseSchema = z.discriminatedUnion("success", [
	SuccessSchema,
	ErrorSchema,
])

export type PostBySlug = z.infer<typeof PostBySlugSchema>
export type APIPostsBySlugResponse = z.infer<
	typeof APIPostsBySlugResponseSchema
>
