import { z } from "zod";
import { eq } from "drizzle-orm";

import { cups } from "@fsx/db/schema/cups";
import { protectedProcedure, publicProcedure, router } from "../index";

export const cupsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.cups.findMany({
      columns: { id: true, name: true, imageUrl: true, startDate: true, endDate: true, prizePool: true, rhythm: true, championshipId: true },
      with: {
        championship: { columns: { id: true, name: true } },
        cupBrackets: {
          columns: { id: true, bracketType: true },
          with: {
            cupPlayoffs: {
              columns: { id: true, phaseType: true, order: true },
              with: {
                cupMatches: {
                  columns: { id: true, bestOf: true, order: true, date: true },
                  with: {
                    playerOne: { columns: { id: true, name: true, imageUrl: true } },
                    playerTwo: { columns: { id: true, name: true, imageUrl: true } },
                    winner: { columns: { id: true, name: true } },
                    cupGames: { columns: { id: true, gameNumber: true, link: true, winnerId: true } },
                  },
                },
              },
            },
          },
        },
        cupGroups: {
          columns: { id: true, name: true, order: true },
          with: {
            cupPlayers: {
              columns: { id: true, nickname: true, position: true },
              with: {
                player: { columns: { id: true, name: true, imageUrl: true } },
              },
            },
            cupRounds: {
              columns: { id: true, order: true },
              with: {
                cupMatches: {
                  columns: { id: true, bestOf: true, order: true, date: true, cupPlayoffId: true },
                  with: {
                    playerOne: { columns: { id: true, name: true, imageUrl: true } },
                    playerTwo: { columns: { id: true, name: true, imageUrl: true } },
                    winner: { columns: { id: true, name: true } },
                    cupGames: { columns: { id: true, gameNumber: true, link: true, winnerId: true } },
                  },
                },
              },
            },
          },
        },
      },
    })
  ),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.cups.findFirst({
        where: eq(cups.id, input.id),
        columns: { id: true, name: true, imageUrl: true, startDate: true, endDate: true, prizePool: true, rhythm: true, championshipId: true },
        with: {
          championship: { columns: { id: true, name: true } },
          cupBrackets: {
            columns: { id: true, bracketType: true },
            with: {
              cupPlayoffs: {
                columns: { id: true, phaseType: true, order: true },
                with: {
                  cupMatches: {
                    columns: { id: true, bestOf: true, order: true, date: true },
                    with: {
                      playerOne: { columns: { id: true, name: true, imageUrl: true } },
                      playerTwo: { columns: { id: true, name: true, imageUrl: true } },
                      winner: { columns: { id: true, name: true } },
                      cupGames: { columns: { id: true, gameNumber: true, link: true, winnerId: true } },
                    },
                  },
                },
              },
            },
          },
          cupGroups: {
            columns: { id: true, name: true, order: true },
            with: {
              cupPlayers: {
                columns: { id: true, nickname: true, position: true },
                with: {
                  player: { columns: { id: true, name: true, imageUrl: true } },
                },
              },
              cupRounds: {
                columns: { id: true, order: true },
                with: {
                  cupMatches: {
                    columns: { id: true, bestOf: true, order: true, date: true, cupPlayoffId: true },
                    with: {
                      playerOne: { columns: { id: true, name: true, imageUrl: true } },
                      playerTwo: { columns: { id: true, name: true, imageUrl: true } },
                      winner: { columns: { id: true, name: true } },
                      cupGames: { columns: { id: true, gameNumber: true, link: true, winnerId: true } },
                    },
                  },
                },
              },
            },
          },
        },
      })
    ),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      imageUrl: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      prizePool: z.number(),
      rhythm: z.string(),
      championshipId: z.number().nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(cups).values(input).returning()
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      imageUrl: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      prizePool: z.number().optional(),
      rhythm: z.string().optional(),
      championshipId: z.number().nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(cups).set(input).where(eq(cups.id, input.id)).returning()
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(cups).where(eq(cups.id, input.id))
    ),
});
