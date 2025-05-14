import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { posts } from "@/db/schema";

export const postsSchema = createSelectSchema(posts);

export const News = postsSchema
  .pick({
    id: true,
    title: true,
    image: true,
    slug: true,
    createdAt: true,
  })
  .extend({
    title: z.string().max(80, "Title cannot exceed 80 characters"),
    image: z.string().url("Invalid image URL").optional(),
    slug: z.string()
      .max(80, "Slug cannot exceed 80 characters")
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
    createdAt: z.string().datetime(),
  });

export const SuccessNewsSchema = z.object({
  success: z.literal(true),
  data: z.array(News),
});

export const ErrorNewsSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APINewsResponseSchema = z.discriminatedUnion("success", [
  SuccessNewsSchema,
  ErrorNewsSchema,
]);

export type News = z.infer<typeof News>;
export type SuccessNewsResponse = z.infer<typeof SuccessNewsSchema>['data'];
export type APINewsResponse = z.infer<typeof APINewsResponseSchema>;
