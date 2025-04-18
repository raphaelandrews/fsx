import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { posts } from "~/db/schema";

const baseInsertSchema = createInsertSchema(posts);
const postsSchema = createSelectSchema(posts);

export const PaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const NewsBaseSchema = postsSchema.extend({
  title: z.string().max(80, "Title cannot exceed 80 characters"),
  image: z.string().optional(),
  content: z.string().max(1000, "Content cannot exceed 1000 characters"),
  slug: z.string().max(80, "Slug cannot exceed 80 characters"),
  published: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict();

export const NewsResponseSchema = NewsBaseSchema.extend({
  id: z.string().max(80, "ID should be a valid string and max 80 characters."),
}).partial();

export const PaginatedNewsResponseSchema = z.object({
  news: z.array(NewsResponseSchema),
  pagination: PaginationSchema,
});

export const NewsMutationSchema = baseInsertSchema
  .omit({ id: true }) 
  .extend({
    title: z.string().max(80),
    image: z.string().optional(),
    content: z.string().max(1000),
    slug: z.string().max(80),
    published: z.boolean(),
  })
  .partial();

export const SuccessNewsResponseSchema = NewsResponseSchema;

export const ErrorNewsResponseSchema = z.object({
  error: z.string(),
});

export type NewsResponse = z.infer<typeof NewsResponseSchema>;
export type NewsMutation = z.infer<typeof NewsMutationSchema>;
export type SuccessNewsResponse = z.infer<typeof SuccessNewsResponseSchema>;
export type ErrorNewsResponse = z.infer<typeof ErrorNewsResponseSchema>;
export type PaginatedNewsResponse = z.infer<typeof PaginatedNewsResponseSchema>;
