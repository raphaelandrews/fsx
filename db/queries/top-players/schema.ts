import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players, locations, championships, titles } from "@/db/schema";

const topPlayerSchema = createSelectSchema(players);

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

export const TopPlayers = topPlayerSchema
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

export const SuccessTopPlayersSchema = z.object({
  success: z.literal(true),
  data: z.object({
    topClassic: z.array(TopPlayers),
    topRapid: z.array(TopPlayers),
    topBlitz: z.array(TopPlayers),
  }),
});

const ErrorTopPlayersSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APITopPlayersResponseSchema = z.discriminatedUnion("success", [
  SuccessTopPlayersSchema,
  ErrorTopPlayersSchema,
]);

export type TopPlayer = z.infer<typeof TopPlayers>;
export type SuccessTopPlayersResponse = z.infer<typeof SuccessTopPlayersSchema>['data'];
export type APITopPlayersResponse = z.infer<typeof APITopPlayersResponseSchema>;
