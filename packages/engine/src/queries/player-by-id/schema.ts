import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
    clubs,
    players,
    locations,
    playersToRoles,
    playersToTitles,
    playersToTournaments,
    tournamentPodiums,
    tournaments,
    roles,
    titles,
    defendingChampions,
    championships
} from "../../db/schema/index";

const baseInsertSchema = createInsertSchema(players);
const playerByIdSchema = createSelectSchema(players);

const clubSchema = createSelectSchema(clubs);
const locationSchema = createSelectSchema(locations);
const tournamentSchema = createSelectSchema(tournaments);
const championshipSchema = createSelectSchema(championships);
const roleSchema = createSelectSchema(roles);
const titleSchema = createSelectSchema(titles);

const playerToTournamentSchema = createSelectSchema(playersToTournaments).pick({
    ratingType: true,
    oldRating: true,
    variation: true
}).extend({
    tournament: tournamentSchema.pick({ name: true })
});

const defendingChampionsSchema = createSelectSchema(defendingChampions).extend({
    championship: championshipSchema.pick({ name: true })
});

const playerToRoleSchema = createSelectSchema(playersToRoles).extend({
    role: roleSchema.pick({ role: true, type: true, shortRole: true })
});

const tournamentPodiumSchema = createSelectSchema(tournamentPodiums).pick({
    place: true
}).extend({
    tournament: tournamentSchema.pick({ name: true, championshipId: true })
});

const playerToTitleSchema = createSelectSchema(playersToTitles).extend({
    title: titleSchema.pick({ type: true, title: true, shortTitle: true })
});

export const PlayerByIdBaseSchema = playerByIdSchema.extend({
    id: z.number().int().positive(),
    name: z.string().max(100, "Name must be 100 characters or less"),
    nickname: z.string().max(20, "Nickname must be 20 characters or less").nullable().optional(),
    blitz: z.number().int().min(0).max(32767),
    rapid: z.number().int().min(0).max(32767),
    classic: z.number().int().min(0).max(32767),
    active: z.boolean(),
    imageUrl: z.string().url().nullable().optional(),
    cbxId: z.number().nullable().optional(),
    fideId: z.number().nullable().optional(),
    verified: z.boolean(),
}).strict();

export const PlayerByIdResponseSchema = PlayerByIdBaseSchema.extend({
    club: clubSchema.pick({ name: true, logo: true }).nullable(),
    location: locationSchema.pick({ flag: true, name: true }).nullable(),
    defendingChampions: z.array(defendingChampionsSchema).optional(),
    playersToTournaments: z.array(playerToTournamentSchema).optional(),
    playersToRoles: z.array(playerToRoleSchema).optional(),
    tournamentPodiums: z.array(tournamentPodiumSchema).optional(),
    playersToTitles: z.array(playerToTitleSchema).optional()
});

export const PlayerMutationSchema = baseInsertSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({
        name: z.string().max(100),
        nickname: z.string().max(20).optional(),
        imageUrl: z.string().url().optional()
    })
    .partial();

export const SuccessPlayerByIdResponseSchema = PlayerByIdResponseSchema;

export const ErrorPlayerByIdResponseSchema = z.object({
    error: z.string(),
});

export type PlayerByIdResponse = z.infer<typeof PlayerByIdResponseSchema>;
export type PlayerMutation = z.infer<typeof PlayerMutationSchema>;
export type SuccessPlayerByIdResponse = z.infer<typeof SuccessPlayerByIdResponseSchema>;
export type ErrorPlayerByIdResponse = z.infer<typeof ErrorPlayerByIdResponseSchema>;
