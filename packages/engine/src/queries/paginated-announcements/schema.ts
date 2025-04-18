import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { announcements } from "../../db/schema";

const announcementsSchema = createSelectSchema(announcements);

export const AnnouncementsPaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const AnnouncementsBaseSchema = announcementsSchema.extend({
  year: z.number().min(1900).max(2100, "Year must be between 1900 and 2100"),
  number: z.string().length(3, "Number must be 3 characters long"),
  content: z.string().max(1000, "Content cannot exceed 1000 characters"),
}).strict();

export const AnnouncementsResponseSchema = AnnouncementsBaseSchema.extend({
  id: z.number().int(),
}).partial();

export const PaginatedAnnouncementsResponseSchema = z.object({
  announcements: z.array(AnnouncementsResponseSchema),
  pagination: AnnouncementsPaginationSchema,
});

export const SuccessAnnouncementsResponseSchema = AnnouncementsResponseSchema;

export const ErrorAnnouncementsResponseSchema = z.object({
  error: z.string(),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
  }).optional(),
});

export type AnnouncementsResponse = z.infer<typeof AnnouncementsResponseSchema>;
export type SuccessAnnouncementsResponse = z.infer<typeof SuccessAnnouncementsResponseSchema>;
export type ErrorAnnouncementsResponse = z.infer<typeof ErrorAnnouncementsResponseSchema>;
export type PaginatedAnnouncementsResponse = z.infer<typeof PaginatedAnnouncementsResponseSchema>;
