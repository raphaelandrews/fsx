import { z } from "zod";

const FreshNewsItemSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  image: z.string().nullable(),
  slug: z.string().nullable(),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.array(FreshNewsItemSchema),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APIFreshNewsResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type FreshNews = z.infer<typeof FreshNewsItemSchema>;
export type APIFreshNewsResponse = z.infer<typeof APIFreshNewsResponseSchema>;
