import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { announcements } from "../../db/schema";

const baseInsertSchema = createInsertSchema(announcements);
const announcementByIdSchema = createSelectSchema(announcements);

export const AnnouncementByIdBaseSchema = announcementByIdSchema.extend({
  year: z.number().min(1900).max(2100, "Year must be between 1900 and 2100"),
  number: z.string().length(3, "Number must be 3 characters long"),
  content: z.string().max(1000, "Content cannot exceed 1000 characters"),
}).strict();

export const AnnouncementByIdResponseSchema = AnnouncementByIdBaseSchema.extend({
  id: z.number().int(),
}).partial();

export const AnnouncementMutationSchema = baseInsertSchema
  .omit({ id: true })
  .extend({
    year: z.number().min(1900).max(2100),
    number: z.string().length(3),
    content: z.string().max(1000),
  })
  .partial();

export const SuccessAnnouncementByIdResponseSchema = AnnouncementByIdResponseSchema;

export const ErrorAnnouncementByIdResponseSchema = z.object({
  error: z.string(),
});

export type AnnouncementByIdResponse = z.infer<typeof AnnouncementByIdResponseSchema>;
export type AnnouncementMutation = z.infer<typeof AnnouncementMutationSchema>;
export type SuccessAnnouncementByIdResponse = z.infer<typeof SuccessAnnouncementByIdResponseSchema>;
export type ErrorAnnouncementByIdResponse = z.infer<typeof ErrorAnnouncementByIdResponseSchema>;
