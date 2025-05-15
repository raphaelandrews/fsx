import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { players } from '~/db/schema';
import { APIPlayerByIdResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIPlayerByIdResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/player/$id')({
  GET: async ({ request, params }) => {
    console.info(`Fetching player ${params.id} from ${request.url}`);
    const id = Number(params.id);

    try {
      const player = await db.query.players.findFirst({
        where: eq(players.id, id),
        columns: {
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
        },
        with: {
          club: {
            columns: {
              name: true,
              logo: true
            }
          },
          location: {
            columns: {
              name: true,
              flag: true
            }
          },
          defendingChampions: {
            columns: {},
            with: {
              championship: {
                columns: {
                  name: true
                }
              },
            },
          },
          playersToTournaments: {
            columns: {
              ratingType: true,
              oldRating: true,
              variation: true
            },
            with: {
              tournament: {
                columns: {
                  name: true
                }
              },
            },
          },
          playersToRoles: {
            columns: {},
            with: {
              role: {
                columns: {
                  role: true,
                  shortRole: true,
                  type: true
                }
              }
            }
          },
          tournamentPodiums: {
            columns: {
              place: true
            },
            with: {
              tournament: {
                columns: {
                  name: true,
                  championshipId: true,
                  date: true
                }
              }
            },
          },
          playersToTitles: {
            columns: {},
            with: {
              title: {
                columns: {
                  title: true,
                  shortTitle: true,
                  type: true
                }
              }
            }
          }
        },
      })

      if (!player) {
        return createResponse({
          success: false,
          error: { code: 404, message: `Player ${id} not found` },
        }, 404);
      }

      if (player.tournamentPodiums) {
        player.tournamentPodiums.sort((a, b) => {
          const dateA = a.tournament?.date ? new Date(a.tournament.date).getTime() : 0;
          const dateB = b.tournament?.date ? new Date(b.tournament.date).getTime() : 0;
          return dateA - dateB;
        });
      }

      const validation = APIPlayerByIdResponseSchema.safeParse({ success: true, data: player });

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return createResponse({
          success: false,
          error: { code: 400, message: 'Invalid data format', details: validation.error.errors },
        }, 400);
      }

      return createResponse(validation.data);

    } catch (error: unknown) {
      const details =
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined;

      console.error('[ERROR]:', error);
      return createResponse({
        success: false,
        error: {
          code: 500,
          message: 'Internal server error',
          details,
        }
      }, 500);
    }
  },

  OPTIONS: async () => new Response(null, { status: 204 }),
});
