import { z } from "zod";
import { titleTypeEnum } from "@/db/schema";

const TitleSchema = z.object({
  title: z.object({
    title: z.string().max(40),
    shortTitle: z.string().max(4),
    type: z.enum(titleTypeEnum.enumValues),
  }),
});

const LocationSchema = z.object({
  name: z.string().max(80),
  flag: z.string().nullable(),
});

const ChampionshipSchema = z.object({
  championship: z.object({
    name: z.string().max(80),
  }),
});

const TopPlayerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100),
  nickname: z.string().max(20).nullable(),
  blitz: z.number().int().min(0).default(1900),
  rapid: z.number().int().min(0).default(1900),
  classic: z.number().int().min(0).default(1900),
  imageUrl: z.string().url().nullable(),
  active: z.boolean().default(false),
  verified: z.boolean().default(false),
  sex: z.boolean().default(false),
  location: LocationSchema.nullable(),
  defendingChampions: z.array(ChampionshipSchema).default([]),
  playersToTitles: z.array(TitleSchema).default([]),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    topClassic: z.array(TopPlayerSchema).nonempty(),
    topRapid: z.array(TopPlayerSchema).nonempty(),
    topBlitz: z.array(TopPlayerSchema).nonempty(),
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

export const APITopPlayersResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type TopPlayer = z.infer<typeof TopPlayerSchema>;
export type APITopPlayersResponse = z.infer<typeof APITopPlayersResponseSchema>;
