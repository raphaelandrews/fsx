import { z } from "zod";
import { eq } from "drizzle-orm";

import { cups } from "@fsx/db/schema/cups";
import { adminProcedure, publicProcedure, router } from "../index";

export const cupsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.cups.findMany({
      columns: { id: true, name: true, imageUrl: true, startDate: true, endDate: true, prizePool: true, ratingType: true, championshipId: true },
      with: {
        championship: { columns: { id: true, name: true } },
        cupBrackets: {
          columns: { id: true, bracketType: true },
          with: {
            cupPlayoffs: {
              columns: { id: true, phaseType: true, sortOrder: true },
              with: {
                cupMatches: {
                  columns: { id: true, bestOf: true, sortOrder: true, date: true },
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
          columns: { id: true, name: true, sortOrder: true },
          with: {
            cupPlayers: {
              columns: { id: true, nickname: true, position: true },
              with: {
                player: { columns: { id: true, name: true, imageUrl: true } },
              },
            },
            cupRounds: {
              columns: { id: true, sortOrder: true },
              with: {
                cupMatches: {
                  columns: { id: true, bestOf: true, sortOrder: true, date: true, cupPlayoffId: true },
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
        columns: { id: true, name: true, imageUrl: true, startDate: true, endDate: true, prizePool: true, ratingType: true, championshipId: true },
        with: {
          championship: { columns: { id: true, name: true } },
          cupBrackets: {
            columns: { id: true, bracketType: true },
            with: {
              cupPlayoffs: {
                columns: { id: true, phaseType: true, sortOrder: true },
                with: {
                  cupMatches: {
                    columns: { id: true, bestOf: true, sortOrder: true, date: true },
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
            columns: { id: true, name: true, sortOrder: true },
            with: {
              cupPlayers: {
                columns: { id: true, nickname: true, position: true },
                with: {
                  player: { columns: { id: true, name: true, imageUrl: true } },
                },
              },
              cupRounds: {
                columns: { id: true, sortOrder: true },
                with: {
                  cupMatches: {
                    columns: { id: true, bestOf: true, sortOrder: true, date: true, cupPlayoffId: true },
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

  create: adminProcedure
    .input(z.object({
      name: z.string(),
      imageUrl: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      prizePool: z.number(),
      ratingType: z.string(),
      championshipId: z.number().nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(cups).values(input).returning()
    ),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      imageUrl: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      prizePool: z.number().optional(),
      ratingType: z.string().optional(),
      championshipId: z.number().nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(cups).set(input).where(eq(cups.id, input.id)).returning()
    ),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(cups).where(eq(cups.id, input.id))
    ),
});
