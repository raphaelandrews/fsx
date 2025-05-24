import { z } from "zod";

const AnnouncementSchema = z.object({
  id: z.number().int().positive(),
  year: z.number().int(),
  number: z.string().max(3),
  content: z.string(),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.array(AnnouncementSchema),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APIAllAnnouncementsResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type Announcement = z.infer<typeof AnnouncementSchema>;
export type APIAllAnnouncementsResponse = z.infer<typeof APIAllAnnouncementsResponseSchema>;
