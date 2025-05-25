import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players, locations, championships, titles, clubs } from "@/db/schema";

export const PlayerQuerySchema = z.object({
  group: z.enum(["U10", "U12", "U14", "U16", "U18"]).optional(),
  sortBy: z.enum(["rapid", "blitz", "classic"]).optional(),
  page: z.string().transform(Number).optional(),
  perPage: z.string().transform(Number).optional(),
});

export type PlayerQueryParams = z.infer<typeof PlayerQuerySchema>;

export const PlayersPaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  sortBy: z.enum(["rapid", "blitz", "classic"]).optional(),
});

const playersSchema = createSelectSchema(players);
const clubSchema = createSelectSchema(clubs);
const locationSchema = createSelectSchema(locations);
const championshipSchema = createSelectSchema(championships);
const titleSchema = createSelectSchema(titles);

const defendingChampionsSchema = z.object({
  championship: championshipSchema.pick({ name: true }).extend({
    name: z.string(),
  }),
}).strict();

const playerToTitleSchema = z.object({
  title: titleSchema.pick({ type: true, title: true, shortTitle: true }),
});

export const PlayerSchema = playersSchema
  .pick({
    id: true,
    name: true,
    nickname: true,
    classic: true,
    rapid: true,
    blitz: true,
    imageUrl: true,
    birth: true,
    sex: true,
  })
  .extend({
    id: z.number().int().positive(),
    name: z.string().max(100, "Name must be 100 characters or less"),
    nickname: z.string().max(20, "Nickname must be 20 characters or less").nullable().optional(),
    classic: z.number().int().min(0).max(32767),
    rapid: z.number().int().min(0).max(32767),
    blitz: z.number().int().min(0).max(32767),
    imageUrl: z.string().url().nullable().optional(),
    birth: z.custom<Date>(),
    sex: z.boolean(),
    club: clubSchema.pick({ id: true, name: true, logo: true }).nullable().optional(),
    location: locationSchema.pick({ flag: true, name: true }).nullable().optional(),
    defendingChampions: z.array(defendingChampionsSchema).optional(),
    playersToTitles: z.array(playerToTitleSchema).optional(),
  });

export const SuccessPlayersSchema = z.object({
  success: z.literal(true),
  data: z.object({
    players: z.array(PlayerSchema),
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

export type Players = z.infer<typeof PlayerSchema>;
export type SuccessPlayersResponse = z.infer<typeof SuccessPlayersSchema>["data"];
export type APIPlayersResponse = z.infer<typeof APIPlayersResponseSchema>;
export type PlayersPagination = z.infer<typeof PlayersPaginationSchema>;
