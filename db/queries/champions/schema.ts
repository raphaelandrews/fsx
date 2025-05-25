import { z } from "zod";
import { titleTypeEnum } from "@/db/schema/titles";

const TitleSchema = z.object({
  title: z.object({
    shortTitle: z.string().max(4),
    type: z.enum(titleTypeEnum.enumValues),
  }),
});

const LocationSchema = z.object({
  name: z.string().max(80),
});

const PlayerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100),
  nickname: z.string().max(20).nullable(),
  imageUrl: z.string().nullable(),
  location: LocationSchema.nullable(),
  playersToTitles: z.array(TitleSchema).default([]),
});

const TournamentPodiumSchema = z.object({
  place: z.number().int(),
  player: PlayerSchema,
});

const TournamentSchema = z.object({
  name: z.string().max(80),
  date: z.union([z.date(), z.string()]).nullable(),
  tournamentPodiums: z.array(TournamentPodiumSchema).default([]),
});

const ChampionshipSchema = z.object({
  name: z.string().max(80),
  tournaments: z.array(TournamentSchema).default([]),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.array(ChampionshipSchema),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APIChampionsResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type Championship = z.infer<typeof ChampionshipSchema>
export type Tournament = z.infer<typeof TournamentSchema>;;
export type APIChampionsResponse = z.infer<typeof APIChampionsResponseSchema>;
