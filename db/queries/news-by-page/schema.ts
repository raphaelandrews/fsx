import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { posts } from "@/db/schema";

export const NewsPaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const postsByPageSchema = createSelectSchema(posts);

export const NewsByPage = postsByPageSchema
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

export const SuccessNewsByPageSchema = z.object({
  success: z.literal(true),
  data: z.object({
    news: z.array(NewsByPage),
    pagination: NewsPaginationSchema,
  }),
});

export const ErrorNewsByPageSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APINewsByPageResponseSchema = z.discriminatedUnion("success", [
  SuccessNewsByPageSchema,
  ErrorNewsByPageSchema,
]);

export type NewsByPage = z.infer<typeof NewsByPage>;
export type SuccessNewsByPageResponse = z.infer<typeof SuccessNewsByPageSchema>['data'];
export type APINewsByPageResponse = z.infer<typeof APINewsByPageResponseSchema>;
export type NewsPagination = z.infer<typeof NewsPaginationSchema>;
