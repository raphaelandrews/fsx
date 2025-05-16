import { z } from "zod";

const titleSchema = z.object({
  shortTitle: z.string(),
  type: z.string(),
});

const playerSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string().nullable(),
  imageUrl: z.string().nullable(),
  location: z.object({
    name: z.string(),
  }).nullable(),
  playersToTitles: z.array(z.object({
    title: titleSchema,
  })),
});

const tournamentPodiumSchema = z.object({
  place: z.number(),
  player: playerSchema,
});

const tournamentSchema = z.object({
  name: z.string(),
  date: z.date().nullable(),
  tournamentPodiums: z.array(tournamentPodiumSchema),
});

const championshipSchema = z.object({
  name: z.string(),
  tournaments: z.array(tournamentSchema),
});

export const ChampionsSchema = z.array(championshipSchema);

export type Championship = z.infer<typeof championshipSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
export type TournamentPodium = z.infer<typeof tournamentPodiumSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Title = z.infer<typeof titleSchema>;
