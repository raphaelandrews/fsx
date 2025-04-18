import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { posts } from "../../db/schema";

const postsSchema = createSelectSchema(posts);

export const FreshNewsBaseSchema = postsSchema.extend({
  title: z.string().max(80, "Title cannot exceed 80 characters."),
  image: z.string().optional(),
  slug: z.string().max(80, "Slug cannot exceed 80 characters."),
}).strict();

export const FreshNewsResponseSchema = FreshNewsBaseSchema.extend({
  id: z.string().max(80, "ID should be a valid string and max 80 characters."),
}).strict();


export const SuccessFreshNewsResponseSchema = z.array(FreshNewsResponseSchema);

export const ErrorFreshNewsResponseSchema = z.object({
  error: z.string(),
});

export type FreshNewsResponse = z.infer<typeof FreshNewsResponseSchema>;
export type SuccessFreshNewsResponse = z.infer<typeof SuccessFreshNewsResponseSchema>;
export type ErrorFreshNewsResponse = z.infer<typeof ErrorFreshNewsResponseSchema>;