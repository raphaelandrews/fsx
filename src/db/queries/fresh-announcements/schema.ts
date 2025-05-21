import { z } from "zod";

const AnnouncementSchema = z.object({
  id: z.number().int().positive(),
  year: z.number().int(),
  number: z.string().max(3),
  content: z.string(),
});

export const APIFreshAnnouncementsResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    data: z.array(AnnouncementSchema),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.number().int(),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
]);

export type Announcement = z.infer<typeof AnnouncementSchema>;
export type APIFreshAnnouncementsResponse = z.infer<typeof APIFreshAnnouncementsResponseSchema>;