import { z } from "zod";

const NewsBySlugSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  image: z.string().nullable(),
  content: z.string().nullable(),
  slug: z.string().nullable(),
  createdAt: z.string().nullable(),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: NewsBySlugSchema,
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APINewsBySlugResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type NewsBySlug = z.infer<typeof NewsBySlugSchema>;
export type APINewsBySlugResponse = z.infer<typeof APINewsBySlugResponseSchema>;
