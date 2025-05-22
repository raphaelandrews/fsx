import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import type { z } from 'zod';

import { db } from '~/db';
import { APICircuitsResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APICircuitsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/circuits')({
  GET: async ({ request }) => {
    console.info("Fetching circuits... @", request.url);

    try {
      const response = await db.query.circuits.findMany({
        columns: {
          name: true,
          type: true,
        },
        with: {
          circuitPhase: {
            columns: {
              id: true,
              order: true,
            },
            with: {
              tournament: {
                columns: {
                  name: true,
                },
              },
              circuitPodiums: {
                columns: {
                  category: true,
                  place: true,
                  points: true,
                },
                orderBy: (podiums, { desc }) => [desc(podiums.points)],
                with: {
                  player: {
                    columns: {
                      id: true,
                      name: true,
                      nickname: true,
                      imageUrl: true,
                    },
                    with: {
                      club: {
                        columns: {
                          id: true,
                          name: true,
                          logo: true,
                        },
                      },
                      playersToTitles: {
                        columns: {},
                        with: {
                          title: {
                            columns: {
                              shortTitle: true,
                              type: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Circuits not found" },
        }, 404);
      }

      const validation = APICircuitsResponseSchema.safeParse({
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
            message: 'No circuits found'
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
