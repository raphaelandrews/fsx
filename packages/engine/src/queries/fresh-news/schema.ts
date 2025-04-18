import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { posts } from "~/db/schema";

const baseInsertSchema = createInsertSchema(posts);
const postsSchema = createSelectSchema(posts);

export const FreshNewsResponseSchema = postsSchema.extend({
  id: z.string().max(80, "ID should be a valid string and max 80 characters."),
  title: z.string().max(80, "Title cannot exceed 80 characters."),
  image: z.string().optional(),
  content: z.string().max(1000, "Content cannot exceed 1000 characters."),
  slug: z.string().max(80, "Slug cannot exceed 80 characters."),
  published: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict();

export const SuccessFreshNewsResponseSchema = z.object({
  posts: z.array(FreshNewsResponseSchema),
});

export const ErrorFreshNewsResponseSchema = z.object({
  error: z.string(),
});

export const FreshNewsMutationSchema = baseInsertSchema
  .omit({ id: true })
  .extend({
    title: z.string().max(80),
    image: z.string().optional(),
    content: z.string().max(1000),
    slug: z.string().max(80),
    published: z.boolean(),
  })
  .partial();

export type FreshNewsResponse = z.infer<typeof FreshNewsResponseSchema>;
export type FreshNewsMutation = z.infer<typeof FreshNewsMutationSchema>;
export type SuccessFreshNewsResponse = z.infer<typeof SuccessFreshNewsResponseSchema>;
export type ErrorFreshNewsResponse = z.infer<typeof ErrorFreshNewsResponseSchema>;
