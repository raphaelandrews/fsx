import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, asc } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import {
  championships,
  tournaments,
  tournamentPodiums,
  players,
  locations,
  playersToTitles,
  titles
} from '~/db/schema';
import { APIChampionsResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIChampionsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/champions')({
  GET: async ({ request }) => {
    console.info("Fetching champions... @", request.url);

    try {
      const rawData = await db
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

      const response = rawData.reduce((acc, row) => {
        let championship = acc.find(c => c.name === row.championshipName);
        if (!championship) {
          championship = {
            name: row.championshipName,
            tournaments: []
          };
          acc.push(championship);
        }

        let tournament = championship.tournaments.find(t => t.name === row.tournamentName);
        if (!tournament) {
          tournament = {
            name: row.tournamentName,
            date: row.tournamentDate
              ? row.tournamentDate instanceof Date
                ? row.tournamentDate
                : new Date(row.tournamentDate)
              : new Date(),
            tournamentPodiums: []
          };
          championship.tournaments.push(tournament);
        }

        const existingPodium = tournament.tournamentPodiums.find(
          p => p.place === Number(row.podiumPlace) && p.player.id === row.playerId
        );

        if (!existingPodium) {
          tournament.tournamentPodiums.push({
            place: row.podiumPlace,
            player: {
              id: Number(row.playerId),
              name: row.playerName,
              nickname: row.playerNickname ?? '',
              imageUrl: row.playerImageUrl ?? '',
              location: { name: row.locationName ?? 'N/A' },
              playersToTitles: row.playerTitleShort && row.playerTitleType ? [{
                title: {
                  shortTitle: row.playerTitleShort,
                  type: row.playerTitleType
                }
              }] : []
            }
          });
        }

        return acc;
      }, [] as {
        name: string;
        tournaments: {
          name: string;
          date: Date;
          tournamentPodiums: {
            place: number;
            player: {
              id: number;
              name: string;
              nickname: string;
              imageUrl: string;
              location: { name: string };
              playersToTitles: {
                title: {
                  shortTitle: string;
                  type: string;
                }
              }[];
            }
          }[]
        }[]
      }[]);

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Champions not found" },
        }, 404);
      }

      const validation = APIChampionsResponseSchema.safeParse({
        success: true,
        data: response
      });

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return createResponse({
          success: false,
          error: {
            code: 400,
            message: 'Invalid data format',
            details: validation.error.errors,
          }
        }, 400);
      }

      if (validation.data.success && validation.data.data.length === 0) {
        return createResponse({
          success: false,
          error: {
            code: 404,
            message: 'No champions found'
          }
        }, 404);
      }

      return createResponse(validation.data);

    } catch (error: unknown) {
      const details =
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined;

      if (process.env.NODE_ENV === 'development') console.error('[ERROR]:', error);
      return createResponse({
        success: false,
        error: { code: 500, message: 'Internal server error', details }
      }, 500);
    }
  },
});
