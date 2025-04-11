import { z } from "zod";

export const PlayerMainSchema = z.object({
  index: z.number().optional(),
  id: z.number(),
  name: z.string(),
  nickname: z.string().nullable().optional(),
  classic: z.number(),
  rapid: z.number(),
  blitz: z.number(),
  imageUrl: z.string().nullable().optional(),
  location: z
    .object({
      flag: z.string().nullable().optional(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  defendingChampions: z
    .array(
      z.object({
        championship: z.object({
          name: z.string(),
        }),
      })
    )
    .nullable()
    .optional(),
  playersToTitles: z
    .array(
      z.object({
        id: z.number().optional(),
        playerId: z.number().optional(),
        titleId: z.number().optional(),
        titles: z
          .object({
            id: z.number().optional(),
            title: z.string().optional(),
            shortTitle: z.string().optional(),
            type: z.string().optional(),
          })
          .optional(),
      })
    )
    .nullable()
    .optional(),
});

export const TitleSchema = z.object({
  title: z.string(),
  shortTitle: z.string().nullable(),
  type: z.string(),
});

export const ChampionshipSchema = z.object({
  name: z.string(),
});

export const LocationSchema = z.object({
  name: z.string(),
  flag: z.string().nullable(),
});

export const PlayerSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string().nullable(),
  blitz: z.number(),
  rapid: z.number(),
  classic: z.number(),
  imageUrl: z.string().nullable(),
  location: LocationSchema.nullable(),
  defendingChampions: z.array(
    z.object({
      championship: ChampionshipSchema
    })
  ).nullable(),
  playersToTitles: z.array(
    z.object({
      title: TitleSchema
    })
  ).nullable(),
});

export const PlayerProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string().nullable().optional(),
  classic: z.number(),
  rapid: z.number(),
  blitz: z.number(),
  active: z.boolean(),
  imageUrl: z.string().nullable().optional(),
  cbxId: z.number().nullable().optional(),
  fideId: z.number().nullable().optional(),
  verified: z.boolean(),
  clubs: z
    .object({
      name: z.string(),
      logo: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  location: LocationSchema.nullable(),
  defendingChampions: z.array(
    z.object({
      championship: ChampionshipSchema
    })
  ).nullable(),
  playersToTitles: z.array(
    z.object({
      title: TitleSchema
    })
  ).nullable(),
  playersToTournaments: z
    .array(
      z.object({
        ratingType: z.string(),
        oldRating: z.number(),
        variation: z.number(),
        tournament: z.object({
          name: z.string(),
        }),
      })
    )
    .nullable()
    .optional(),
  tournamentPodiums: z
    .array(
      z.object({
        place: z.number(),
        tournament: z.object({
          name: z.string(),
          championshipId: z.number(),
        }),
      })
    )
    .nullable()
    .optional(),
  playersToRoles: z
    .array(
      z.object({
        roles: z.object({
          role: z.string(),
          shortRole: z.string(),
          type: z.string(),
        }),
      })
    )
    .nullable()
    .optional(),
});


export const TopPlayersSchema = z.object({
  topBlitz: z.array(PlayerSchema),
  topRapid: z.array(PlayerSchema),
  topClassic: z.array(PlayerSchema),
});


export type PlayerMain = z.infer<typeof PlayerMainSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type TopPlayers = z.infer<typeof TopPlayersSchema>;
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;