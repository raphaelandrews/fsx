import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players, locations, championships, titles } from "../../db/schema";

export const PlayersPaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

const playersSchema = createSelectSchema(players);

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
  title: titleSchema.pick({ type: true, title: true, shortTitle: true })
});

export const Players = playersSchema
  .pick({
    id: true,
    name: true,
    nickname: true,
    blitz: true,
    rapid: true,
    classic: true,
    imageUrl: true,
  })
  .extend({
    id: z.number().int().positive(),
    name: z.string().max(100, "Name must be 100 characters or less"),
    nickname: z.string().max(20, "Nickname must be 20 characters or less").nullable().optional(),
    blitz: z.number().int().min(0).max(32767),
    rapid: z.number().int().min(0).max(32767),
    classic: z.number().int().min(0).max(32767),
    imageUrl: z.string().url().nullable().optional(),
    location: locationSchema.pick({ flag: true, name: true }).nullable(),
    defendingChampions: z.array(defendingChampionsSchema).optional(),
    playersToTitles: z.array(playerToTitleSchema).optional()
  });

export const SuccessPlayersSchema = z.object({
  success: z.literal(true),
  data: z.object({
    players: z.array(Players),
    pagination: PlayersPaginationSchema,
  }),
});

const ErrorPlayersSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APIPlayersResponseSchema = z.discriminatedUnion("success", [
  SuccessPlayersSchema,
  ErrorPlayersSchema,
]);

export type Player = z.infer<typeof Players>;
export type SuccessPlayersResponse = z.infer<typeof SuccessPlayersSchema>['data'];
export type APIPlayersResponse = z.infer<typeof APIPlayersResponseSchema>;
export type PlayersPagination = z.infer<typeof PlayersPaginationSchema>;
