import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players, clubs, locations, tournaments, championships, roles, titles, playersToTournaments, tournamentPodiums } from "@/db/schema";

const playerSchema = createSelectSchema(players)

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

const defendingChampionsSchema = z.object({
    championship: championshipSchema.pick({
        name: true,
    }).extend({
        name: z.string()
    })
}).strict();

const playerToRoleSchema = z.object({
    role: roleSchema.pick({ role: true, type: true, shortRole: true })
});

const tournamentPodiumSchema = createSelectSchema(tournamentPodiums).pick({
    place: true
}).extend({
    tournament: tournamentSchema.pick({ name: true, championshipId: true })
});

const playerToTitleSchema = z.object({
    title: titleSchema.pick({ type: true, title: true, shortTitle: true })
});

export const PlayerByIdSchema = playerSchema
    .pick({
        id: true,
        name: true,
        nickname: true,
        blitz: true,
        rapid: true,
        classic: true,
        active: true,
        imageUrl: true,
        cbxId: true,
        fideId: true,
        verified: true,
    })
    .extend({
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
        club: clubSchema.pick({ name: true, logo: true }).nullable(),
        location: locationSchema.pick({ flag: true, name: true }).nullable(),
        defendingChampions: z.array(defendingChampionsSchema).optional(),
        playersToTournaments: z.array(playerToTournamentSchema).optional(),
        playersToRoles: z.array(playerToRoleSchema).optional(),
        tournamentPodiums: z.array(tournamentPodiumSchema).optional(),
        playersToTitles: z.array(playerToTitleSchema).optional()
    });

export const SuccessPlayerByIdResponseSchema = z.object({
    success: z.literal(true),
    data: PlayerByIdSchema,
});

const ErrorPlayerByIdResponseSchema = z.object({
    success: z.literal(false),
    error: z.object({
        code: z.number(),
        message: z.string(),
        details: z.any().optional(),
    }),
});

export const APIPlayerByIdResponseSchema = z.discriminatedUnion("success", [
    SuccessPlayerByIdResponseSchema,
    ErrorPlayerByIdResponseSchema,
]);

export type PlayerById = z.infer<typeof PlayerByIdSchema>;
export type APIPlayerByIdResponse = z.infer<typeof APIPlayerByIdResponseSchema>;
