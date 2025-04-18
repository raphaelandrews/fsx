import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { posts } from "../../db/schema";

const postsSchema = createSelectSchema(posts);

export const NewsPaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const NewsBaseSchema = postsSchema.extend({
  title: z.string().max(80, "Title cannot exceed 80 characters."),
  image: z.string().optional(),
  slug: z.string().max(80, "Slug cannot exceed 80 characters."),
  createdAt: z.string().datetime(),
}).strict();

export const NewsResponseSchema = NewsBaseSchema.extend({
  id: z.string().max(80, "ID should be a valid string and max 80 characters."),
}).partial();

export const PaginatedNewsResponseSchema = z.object({
  news: z.array(NewsResponseSchema),
  pagination: NewsPaginationSchema,
});

export const SuccessNewsResponseSchema = NewsResponseSchema;

export const ErrorNewsResponseSchema = z.object({
  error: z.string(),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
  }).optional(),
});

export type NewsResponse = z.infer<typeof NewsResponseSchema>;
export type SuccessNewsResponse = z.infer<typeof SuccessNewsResponseSchema>;
export type ErrorNewsResponse = z.infer<typeof ErrorNewsResponseSchema>;
export type PaginatedNewsResponse = z.infer<typeof PaginatedNewsResponseSchema>;
