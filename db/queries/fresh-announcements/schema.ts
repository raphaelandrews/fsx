import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { announcements } from "@/db/schema";

const announcementSchema = createSelectSchema(announcements)

export const FreshAnnouncementsSchema = announcementSchema.pick({
  id: true,
  year: true,
  number: true,
  content: true
})
  .extend({
    id: z.number().int().positive(),
    year: z.number()
      .min(1900, "Year must be between 1900 and 2100")
      .max(2100, "Year must be between 1900 and 2100"),
    number: z.string()
      .length(3, "Number must be 3 characters long"),
    content: z.string()
      .max(1000, "Content cannot exceed 1000 characters"),
  });

const SuccessFreshAnnouncementsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(FreshAnnouncementsSchema),
});

const ErrorFreshAnnouncementsResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  })
});

export const APIFreshAnnouncementsResponseSchema = z.discriminatedUnion("success", [
  SuccessFreshAnnouncementsResponseSchema,
  ErrorFreshAnnouncementsResponseSchema,
]);

export type FreshAnnouncement = z.infer<typeof FreshAnnouncementsSchema>;
export type APIFreshAnnouncementsResponse = z.infer<typeof APIFreshAnnouncementsResponseSchema>;
