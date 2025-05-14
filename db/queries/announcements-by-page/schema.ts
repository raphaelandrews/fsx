import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { announcements } from '@/db/schema';

const AnnouncementsPaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

const announcementsSchema = createSelectSchema(announcements);

export const Announcements = announcementsSchema.pick({
  id: true,
  year: true,
  number: true,
  content: true,
}).extend({
  year: z.number()
    .min(1900, "Year must be between 1900 and 2100")
    .max(2100, "Year must be between 1900 and 2100"),
  number: z.string()
    .length(3, "Number must be 3 characters long"),
  content: z.string()
    .max(1000, "Content cannot exceed 1000 characters"),
});

export const SuccessAnnouncementsSchema = z.object({
  success: z.literal(true),
  data: z.object({
    announcements: z.array(Announcements),
    pagination: AnnouncementsPaginationSchema,
  }),
});

const ErrorAnnouncementsSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APIAnnouncementsResponseSchema = z.discriminatedUnion("success", [
  SuccessAnnouncementsSchema,
  ErrorAnnouncementsSchema,
]);

export type Announcements = z.infer<typeof Announcements>;
export type SuccessAnnouncementsResponse = z.infer<typeof SuccessAnnouncementsSchema>['data'];
export type APIAnnouncementsResponse = z.infer<typeof APIAnnouncementsResponseSchema>;
export type AnnouncementsPagination = z.infer<typeof AnnouncementsPaginationSchema>;
