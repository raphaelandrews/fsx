import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { posts } from "@/db/schema";

const postsSchema = createSelectSchema(posts);

export const FreshNews = postsSchema.pick({
  id: true,
  title: true,
  image: true,
  slug: true
}).extend({
  id: z.coerce.string(),
  title: z.string()
    .max(80, "Title cannot exceed 80 characters")
    .transform(val => val.trim()),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  image: z.string()
    .url("Invalid image URL format")
    .optional()
});

export const SuccessFreshNewsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(FreshNews)
});

export const ErrorFreshNewsResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  })
});

export const APIFreshNewsResponseSchema = z.discriminatedUnion("success", [
  SuccessFreshNewsResponseSchema,
  ErrorFreshNewsResponseSchema
]);

export type FreshNews = z.infer<typeof FreshNews>;
export type APIFreshNewsResponse = z.infer<typeof APIFreshNewsResponseSchema>;