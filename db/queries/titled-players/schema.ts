import { z } from "zod";
import { titleTypeEnum } from "@/db/schema";

const TitleSchema = z.object({
  title: z.object({
    title: z.string().max(40),
    shortTitle: z.string().max(4),
    type: z.enum(titleTypeEnum.enumValues),
  }),
});

const TitledPlayerSchema = z.object({
  id: z.number(),
  name: z.string().max(100),
  imageUrl: z.string().url().nullable(),
  rapid: z.number().int().min(0).default(1900),
  playersToTitles: z.array(TitleSchema).default([]),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.array(TitledPlayerSchema)
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APITitledPlayersResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type TitledPlayer = z.infer<typeof TitledPlayerSchema>;
export type APITitledPlayersResponse = z.infer<typeof APITitledPlayersResponseSchema>;
