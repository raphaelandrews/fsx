import { z } from "zod";

const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  image: z.string().nullable(),
  slug: z.string().nullable(),
  createdAt: z.string().nullable(),
});

const PaginationSchema = z.object({
  currentPage: z.number().int().positive(),
  totalPages: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  itemsPerPage: z.number().int().positive(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    news: z.array(NewsItemSchema),
    pagination: PaginationSchema,
  }),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APINewsByPageResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type NewsItem = z.infer<typeof NewsItemSchema>;
export type APINewsByPageResponse = z.infer<typeof APINewsByPageResponseSchema>;
