import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players, locations, championships, titles } from "../../db/schema";

const playersSchema = createSelectSchema(players);

const locationSchema = createSelectSchema(locations);
const championshipSchema = createSelectSchema(championships);
const titleSchema = createSelectSchema(titles);

export const PlayersPaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

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


export const PlayersBaseSchema = playersSchema.extend({
  id: z.number().int(),
  name: z.string().max(100, "Name cannot exceed 100 characters"),
  nickname: z.string().max(20, "Nickname cannot exceed 20 characters").nullable().optional(),
  blitz: z.number().int().min(0).max(32767),
  rapid: z.number().int().min(0).max(32767),
  classic: z.number().int().min(0).max(32767),
  imageUrl: z.string().url().nullable().optional(),
}).strict();

export const PlayersResponseSchema = PlayersBaseSchema.extend({
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

export const PaginatedPlayersResponseSchema = z.object({
  players: z.array(PlayersResponseSchema),
  pagination: PlayersPaginationSchema,
});

export const SuccessPlayersResponseSchema = PlayersResponseSchema;

export const ErrorPlayersResponseSchema = z.object({
  error: z.string(),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
  }).optional(),
});

export type PlayersResponse = z.infer<typeof PlayersResponseSchema>;
export type SuccessPlayersesponse = z.infer<typeof SuccessPlayersResponseSchema>;
export type ErrorPlayersResponse = z.infer<typeof ErrorPlayersResponseSchema>;
export type PaginatedPlayersResponse = z.infer<typeof PaginatedPlayersResponseSchema>;
