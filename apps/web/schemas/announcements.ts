import { z } from "zod";

export const FreshAnnouncementsSchema = z.object({
  id: z.number().int().positive({ message: "ID must be a positive integer" }),
  year: z.number(),
  number: z.string().length(3).regex(/^\d+$/, {
    message: "Must be a 3-digit number"
  }),
  content: z.string(),
});

export type FreshAnnouncements = z.infer<typeof FreshAnnouncementsSchema>;

export const FreshAnnouncementsArraySchema = z.array(FreshAnnouncementsSchema);
