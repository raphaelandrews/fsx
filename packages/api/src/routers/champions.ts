import { eq, asc } from "drizzle-orm";

import { championships } from "@fsx/db/schema/championships";
import { tournaments } from "@fsx/db/schema/tournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournamentPodiums";
import { players } from "@fsx/db/schema/players";
import { locations } from "@fsx/db/schema/locations";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { titles } from "@fsx/db/schema/titles";
import { publicProcedure, router } from "../index";

interface PlayerEntry {
  id: number;
  name: string;
  nickname: string;
  imageUrl: string;
  location: { name: string };
  playersToTitles: { title: { shortTitle: string; type: string } }[];
}

interface PodiumEntry {
  place: number;
  player: PlayerEntry;
}

interface TournamentEntry {
  name: string;
  date: string | null;
  podium: PodiumEntry[];
}

export interface ChampionshipEntry {
  name: string;
  tournaments: TournamentEntry[];
}

export const championsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
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
        playerTitleShort: titles.shortTitle,
        playerTitleType: titles.type,
      })
      .from(championships)
      .innerJoin(tournaments, eq(tournaments.championshipId, championships.id))
      .innerJoin(tournamentPodiums, eq(tournamentPodiums.tournamentId, tournaments.id))
      .innerJoin(players, eq(players.id, tournamentPodiums.playerId))
      .leftJoin(locations, eq(locations.id, players.locationId))
      .leftJoin(playersToTitles, eq(playersToTitles.playerId, players.id))
      .leftJoin(titles, eq(titles.id, playersToTitles.titleId))
      .orderBy(asc(championships.name), asc(tournaments.date), asc(tournamentPodiums.place));

    const result = rawData.reduce<ChampionshipEntry[]>((acc, row) => {
      let championship = acc.find((c) => c.name === row.championshipName);
      if (!championship) {
        championship = { name: row.championshipName, tournaments: [] };
        acc.push(championship);
      }

      let tournament = championship.tournaments.find((t) => t.name === row.tournamentName);
      if (!tournament) {
        tournament = { name: row.tournamentName, date: row.tournamentDate, podium: [] };
        championship.tournaments.push(tournament);
      }

      const existingPodium = tournament.podium.find(
        (p) => p.place === Number(row.podiumPlace) && p.player.id === row.playerId,
      );

      if (!existingPodium) {
        tournament.podium.push({
          place: Number(row.podiumPlace),
          player: {
            id: row.playerId,
            name: row.playerName,
            nickname: row.playerNickname ?? "",
            imageUrl: row.playerImageUrl ?? "",
            location: { name: row.locationName ?? "N/A" },
            playersToTitles:
              row.playerTitleShort && row.playerTitleType
                ? [{ title: { shortTitle: row.playerTitleShort, type: row.playerTitleType } }]
                : [],
          },
        });
      }

      return acc;
    }, []);

    return result;
  }),
});
