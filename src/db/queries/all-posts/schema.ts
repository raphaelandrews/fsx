import { z } from "zod";

const PostSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  image: z.string(),
  slug: z.string(),
  published: z.boolean(),
  createdAt: z.string(),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.array(PostSchema),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APIAllPostsByPageResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type Post = z.infer<typeof PostSchema>;
export type APIAllPostsByPageResponse = z.infer<typeof APIAllPostsByPageResponseSchema>;
