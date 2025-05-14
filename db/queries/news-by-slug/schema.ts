import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { posts } from "@/db/schema";

const newsSchema = createSelectSchema(posts)

export const NewsBySlugSchema = newsSchema.pick({
  id: true,
  title: true,
  image: true,
  content: true,
  slug: true,
  createdAt: true
})
  .extend({
    title: z.string().max(80, "Title cannot exceed 80 characters"),
    image: z.string().url("Invalid image URL").optional(),
    content: z.string(),
    slug: z.string()
      .max(80, "Slug cannot exceed 80 characters")
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
    createdAt: z.string().datetime(),
  });

const SuccessNewsBySlugResponseSchema = z.object({
  success: z.literal(true),
  data: NewsBySlugSchema,
});

const ErrorNewsBySlugResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APINewsBySlugResponseSchema = z.discriminatedUnion("success", [
  SuccessNewsBySlugResponseSchema,
  ErrorNewsBySlugResponseSchema,
]);

export type NewsBySlug = z.infer<typeof NewsBySlugSchema>;
export type APINewsBySlugResponse = z.infer<typeof APINewsBySlugResponseSchema>;
