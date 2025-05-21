import { z } from "zod";

const PostByPageSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  image: z.string(),
  slug: z.string(),
  createdAt: z.string(),
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
    posts: z.array(PostByPageSchema),
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

export const APIPostsByPageResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type PostByPage = z.infer<typeof PostByPageSchema>;
export type APIPostsByPageResponse = z.infer<typeof APIPostsByPageResponseSchema>;
