import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { championships, insertChampionshipSchema } from "@fsx/db/schema/championships";
import { tournaments } from "@fsx/db/schema/tournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournamentPodiums";
import { players } from "@fsx/db/schema/players";
import { locations } from "@fsx/db/schema/locations";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { titles } from "@fsx/db/schema/titles";
import { adminProcedure, publicProcedure, router } from "../index";

export const championsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(championships).orderBy(asc(championships.name))
  ),
  gallery: publicProcedure.query(async ({ ctx }) => {
    const rawData = await ctx.db
      .select({
        championshipName: championships.name,
        tournamentName: tournaments.name,
        tournamentDate: tournaments.date,
        podiumPlace: tournamentPodiums.place,
        playerId: players.id,
        playerName: players.name,
        playerNickname: players.nickname,
        playerImageUrl: players.imageUrl,
        locationName: locations.name,
        playerTitleShort: titles.shortName,
        playerTitleType: titles.type,
      })
      .from(championships)
      .innerJoin(tournaments, eq(tournaments.championshipId, championships.id))
      .innerJoin(tournamentPodiums, eq(tournamentPodiums.tournamentId, tournaments.id))
      .innerJoin(players, eq(players.id, tournamentPodiums.playerId))
      .leftJoin(locations, eq(locations.id, players.locationId))
      .leftJoin(playersToTitles, eq(playersToTitles.playerId, players.id))
      .leftJoin(titles, eq(titles.id, playersToTitles.titleId))
      .orderBy(
        asc(championships.name),
        asc(tournaments.date),
        asc(tournamentPodiums.place)
      );

    return rawData.reduce<
      Array<{
        name: string;
        tournaments: Array<{
          name: string;
          date: string | null;
          tournamentPodiums: Array<{
            place: number;
            player: {
              id: number;
              name: string;
              nickname: string | null;
              imageUrl: string | null;
              location: { name: string };
              playersToTitles: Array<{
                title: { shortTitle: string; type: string };
              }>;
            };
          }>;
        }>;
      }>
    >((acc, row) => {
      let championship = acc.find((c) => c.name === row.championshipName);
      if (!championship) {
        championship = { name: row.championshipName, tournaments: [] };
        acc.push(championship);
      }

      let tournament = championship.tournaments.find(
        (t) => t.name === row.tournamentName
      );
      if (!tournament) {
        tournament = { name: row.tournamentName, date: row.tournamentDate, tournamentPodiums: [] };
        championship.tournaments.push(tournament);
      }

      const existingPodium = tournament.tournamentPodiums.find(
        (p) => p.place === row.podiumPlace && p.player.id === row.playerId
      );

      if (!existingPodium) {
        tournament.tournamentPodiums.push({
          place: row.podiumPlace,
          player: {
            id: row.playerId,
            name: row.playerName,
            nickname: row.playerNickname ?? null,
            imageUrl: row.playerImageUrl ?? null,
            location: { name: row.locationName ?? "N/A" },
            playersToTitles:
              row.playerTitleShort && row.playerTitleType
                ? [{ title: { shortTitle: row.playerTitleShort, type: row.playerTitleType } }]
                : [],
          },
        });
      }

      return acc;
    }, [])
      .map((championship) => ({
        ...championship,
        tournaments: [...championship.tournaments].reverse(),
      }));
  }),
  create: adminProcedure
    .input(insertChampionshipSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(championships).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(80) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(championships).set({ name: input.name }).where(eq(championships.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(championships).where(eq(championships.id, input.id))
    ),
});
