import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { announcements } from "~/db/schema";

const baseInsertSchema = createInsertSchema(announcements);
const announcementsSchema = createSelectSchema(announcements);

export const FreshAnnouncementsBaseSchema = announcementsSchema.extend({
  year: z.number().min(1900).max(2100, "Year must be between 1900 and 2100"),
  number: z.string().length(3, "Number must be 3 characters long"),
  content: z.string().max(1000, "Content cannot exceed 1000 characters"),
}).strict();

export const FreshAnnouncementsResponseSchema = FreshAnnouncementsBaseSchema.extend({
  id: z.number().int(),
}).partial();

export const SuccessFreshAnnouncementsResponseSchema = z.object({
  announcements: z.array(FreshAnnouncementsResponseSchema),
});

export const ErrorFreshAnnouncementsResponseSchema = z.object({
  error: z.string(),
});

export const FreshAnnouncementsMutationSchema = baseInsertSchema
  .omit({ id: true }) 
  .extend({
    year: z.number().min(1900).max(2100),
    number: z.string().length(3),
    content: z.string().max(1000),
  })
  .partial();

export type FreshAnnouncementsResponse = z.infer<typeof FreshAnnouncementsResponseSchema>;
export type FreshAnnouncementsMutation = z.infer<typeof FreshAnnouncementsMutationSchema>;
export type SuccessFreshAnnouncementsResponse = z.infer<typeof SuccessFreshAnnouncementsResponseSchema>;
export type ErrorFreshAnnouncementsResponse = z.infer<typeof ErrorFreshAnnouncementsResponseSchema>;
