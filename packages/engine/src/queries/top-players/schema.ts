import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";

import { players, locations, championships, titles } from "../../db/schema";

const playerByIdSchema = createSelectSchema(players);

const locationSchema = createSelectSchema(locations);
const championshipSchema = createSelectSchema(championships);
const titleSchema = createSelectSchema(titles);

const defendingChampionsSchema = z.object({
  championship: championshipSchema.pick({
    name: true,
  }).extend({
    name: z.string()
  })
}).strict();

const playerToTitleSchema = z.object({
  title: titleSchema.pick({ type: true, title: true, shortTitle: true }).extend({
    title: z.string(),
    shortTitle: z.string(),
    type: z.enum(["internal", "external"])
  })
}).strict();

export const TopPlayerBaseSchema = playerByIdSchema.extend({
  id: z.number().int(),
  name: z.string().max(100, "Name cannot exceed 100 characters"),
  nickname: z.string().max(20, "Nickname cannot exceed 20 characters").nullable().optional(),
  blitz: z.number().int().min(0).max(32767),
  rapid: z.number().int().min(0).max(32767),
  classic: z.number().int().min(0).max(32767),
  imageUrl: z.string().url().nullable().optional(),
}).strict();

export const TopPlayerResponseSchema = TopPlayerBaseSchema.extend({
  location: locationSchema.pick({
    name: true,
    flag: true,
  }).extend({
    name: z.string().max(100, "Name cannot exceed 100 characters"),
    nickname: z.string().max(20, "Nickname cannot exceed 20 characters").optional(),
  }).nullable().optional(),
  defendingChampions: z.array(defendingChampionsSchema).optional(),
  playersToTitles: z.array(playerToTitleSchema).optional(),
}).partial();

export const SuccessTopPlayersResponseSchema = z.object({
  topBlitz: z.array(TopPlayerResponseSchema),
  topRapid: z.array(TopPlayerResponseSchema),
  topClassic: z.array(TopPlayerResponseSchema),
});

export const ErrorTopPlayersResponseSchema = z.object({
  error: z.string(),
});

export type TopPlayer = z.infer<typeof TopPlayerResponseSchema>;
export type SuccessTopPlayersResponse = z.infer<typeof SuccessTopPlayersResponseSchema>;
export type ErrorTopPlayersResponse = z.infer<typeof ErrorTopPlayersResponseSchema>;
