import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { eq } from 'drizzle-orm'

import { db } from '@fsx/engine/db';
import { players } from '@fsx/engine/db/schema';
import { ErrorPlayerByIdResponseSchema, SuccessPlayerByIdResponseSchema } from '@fsx/engine/queries';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const APIRoute = createAPIFileRoute('/api/player/$id')({
  GET: async ({ request, params }) => {
    console.info(`Fetching player by id=${params.id}... @`, request.url)

    try {
      const playerId = Number(params.id);
      if (Number.isNaN(playerId)) {
        throw new Error('Invalid player ID');
      }

      const playerById = await db.query.players.findFirst({
        where: eq(players.id, playerId),
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
                  championshipId: true
                }
              }
            }
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

      if (!playerById) {
        const errorResponse = ErrorPlayerByIdResponseSchema.parse({
          error: `Player with ID ${params.id} not found`
        });
        return json(errorResponse, {
          status: 404,
          headers: corsHeaders
        });
      }

      const validatedPlayerById = SuccessPlayerByIdResponseSchema.parse(playerById);

      return json(validatedPlayerById, {
        headers: corsHeaders
      })
    } catch (e) {
      console.error(e)
      const errorResponse = ErrorPlayerByIdResponseSchema.parse({
        error: e instanceof Error ? e.message : 'Failed to fetch player'
      });
      return json(errorResponse, {
        status: 400,
        headers: corsHeaders
      })
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  },
})
