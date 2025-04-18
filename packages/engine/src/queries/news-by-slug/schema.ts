import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { posts } from "../../db/schema";

const postsSchema = createSelectSchema(posts);

export const NewsBySlugResponseSchema = postsSchema
  .pick({
    id: true,
    title: true,
    image: true,
    content: true,
    slug: true,
    createdAt: true,
  })
  .extend({
    id: z.string().max(80),
    title: z.string().max(80),
    image: z.string().optional(),
    content: z.string(),
    slug: z.string().max(80),
    createdAt: z.string().datetime(), 
  })
  .strict();

export const SuccessNewsBySlugResponseSchema = NewsBySlugResponseSchema.nullable();

export const ErrorNewsBySlugResponseSchema = z.object({
  error: z.string(),
});

export type NewsBySlugResponse = z.infer<typeof NewsBySlugResponseSchema>;
export type SuccessNewsBySlugResponse = z.infer<typeof SuccessNewsBySlugResponseSchema>;
export type ErrorNewsBySlugResponse = z.infer<typeof ErrorNewsBySlugResponseSchema>;
