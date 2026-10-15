import { z } from "zod"

const LinksSchema = z.object({
	href: z.string().url(),
	label: z.string().max(50),
	icon: z.string(),
	order: z.number().int().positive(),
})

const LinkGroupsSchema = z.object({
	id: z.number().int().positive(),
	label: z.string().max(50),
	links: z.array(LinksSchema),
})

const SuccessSchema = z.object({
	success: z.literal(true),
	data: z.array(LinkGroupsSchema),
})

const ErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.number().int(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
})

export const APILinksGroupsResponseSchema = z.discriminatedUnion("success", [
	SuccessSchema,
	ErrorSchema,
])

export type LinkGroup = z.infer<typeof LinkGroupsSchema>
export type Link = z.infer<typeof LinksSchema>
export type APILinksGroupsResponse = z.infer<
	typeof APILinksGroupsResponseSchema
>
