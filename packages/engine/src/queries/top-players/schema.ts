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

export const TopPlayerSchema = playerByIdSchema.pick({
  id: true,
  name: true,
  nickname: true,
  blitz: true,
  rapid: true,
  classic: true,
  imageUrl: true,
}).extend({
  id: z.number().int().positive(),
  name: z.string().max(100, "Name cannot exceed 100 characters"),
  nickname: z.string().max(20, "Nickname cannot exceed 20 characters").nullable().optional(),
  blitz: z.number().int().min(0).max(32767),
  rapid: z.number().int().min(0).max(32767),
  classic: z.number().int().min(0).max(32767),
  imageUrl: z.string().url().nullable().optional(),
  location: locationSchema.pick({
    name: true,
    flag: true,
  }).extend({
    name: z.string().max(100, "Name cannot exceed 100 characters"),
    nickname: z.string().max(20, "Nickname cannot exceed 20 characters").optional(),
  }).nullable().optional(),
  defendingChampions: z.array(defendingChampionsSchema).optional(),
  playersToTitles: z.array(playerToTitleSchema).optional(),
}).strict();

export const SuccessTopPlayersResponseSchema = z.object({
  topBlitz: z.array(TopPlayerSchema),
  topRapid: z.array(TopPlayerSchema),
  topClassic: z.array(TopPlayerSchema),
});

export const ErrorTopPlayersResponseSchema = z.object({
  error: z.string(),
});

export type TopPlayer = z.infer<typeof TopPlayerSchema>;
export type SuccessTopPlayersResponse = z.infer<typeof SuccessTopPlayersResponseSchema>;
export type ErrorTopPlayersResponse = z.infer<typeof ErrorTopPlayersResponseSchema>;
