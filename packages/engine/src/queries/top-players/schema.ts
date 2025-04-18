import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { players, locations, defendingChampions, championships, playersToTitles, titles } from "~/db/schema";

const topPlayersSchema = createSelectSchema(players);

const locationSchema = createSelectSchema(locations);
const championshipSchema = createSelectSchema(championships);
const titleSchema = createSelectSchema(titles);

const topPlayerBaseSchema = topPlayersSchema.pick({
  id: true,
  name: true,
  nickname: true,
  blitz: true,
  rapid: true,
  classic: true,
  imageUrl: true,
});

const defendingChampionsSchema = createSelectSchema(defendingChampions).extend({
  championship: championshipSchema.pick({ name: true })
});

const playerToTitleSchema = createSelectSchema(playersToTitles).extend({
  title: titleSchema.pick({ type: true, title: true, shortTitle: true })
});

export const TopPlayerSchema = topPlayerBaseSchema.extend({
  location: locationSchema.pick({ flag: true, name: true }).nullish(),
  defendingChampions: z.array(defendingChampionsSchema),
  playersToTitles: z.array(playerToTitleSchema),
});

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
