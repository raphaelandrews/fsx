import { z } from "zod";
import { eq } from "drizzle-orm";

import { cups } from "@fsx/db/schema/cups";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { idInput, imageUrl, nameText, positiveInt, points } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

const ratingTypeEnum = z.enum(["blitz", "rapid", "classic"]);

export const cupsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.cups.findMany({
      columns: {
        id: true,
        name: true,
        imageUrl: true,
        startDate: true,
        endDate: true,
        prizePool: true,
        ratingType: true,
        championshipId: true,
      },
      with: { championship: { columns: { id: true, name: true } } },
      orderBy: (cup, { desc, asc }) => [desc(cup.startDate), asc(cup.id)],
      limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),

  byId: publicProcedure
    .input(idInput)
    .query(({ ctx, input }) =>
      ctx.db.query.cups.findFirst({
        where: eq(cups.id, input.id),
        columns: { id: true, name: true, imageUrl: true, startDate: true, endDate: true, prizePool: true, ratingType: true, championshipId: true },
        with: {
          championship: { columns: { id: true, name: true } },
          cupBrackets: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: { id: true, bracketType: true },
            with: {
              cupPlayoffs: {
                limit: PUBLIC_NESTED_COLLECTION_LIMIT,
                columns: { id: true, phaseType: true, sortOrder: true },
                with: {
                  cupMatches: {
                    limit: PUBLIC_NESTED_COLLECTION_LIMIT,
                    columns: { id: true, bestOf: true, sortOrder: true, date: true },
                    with: {
                      playerOne: { columns: { id: true, name: true, imageUrl: true } },
                      playerTwo: { columns: { id: true, name: true, imageUrl: true } },
                      winner: { columns: { id: true, name: true } },
                      cupGames: { limit: 3, columns: { id: true, gameNumber: true, link: true, winnerId: true } },
                    },
                  },
                },
              },
            },
          },
          cupGroups: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: { id: true, name: true, sortOrder: true },
            with: {
              cupPlayers: {
                limit: PUBLIC_NESTED_COLLECTION_LIMIT,
                columns: { id: true, nickname: true, position: true },
                with: {
                  player: { columns: { id: true, name: true, imageUrl: true } },
                },
              },
              cupRounds: {
                limit: PUBLIC_NESTED_COLLECTION_LIMIT,
                columns: { id: true, sortOrder: true },
                with: {
                  cupMatches: {
                    limit: PUBLIC_NESTED_COLLECTION_LIMIT,
                    columns: { id: true, bestOf: true, sortOrder: true, date: true, cupPlayoffId: true },
                    with: {
                      playerOne: { columns: { id: true, name: true, imageUrl: true } },
                      playerTwo: { columns: { id: true, name: true, imageUrl: true } },
                      winner: { columns: { id: true, name: true } },
                      cupGames: { limit: 3, columns: { id: true, gameNumber: true, link: true, winnerId: true } },
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
      name: nameText,
      imageUrl: imageUrl,
      startDate: z.string().max(40),
      endDate: z.string().max(40),
      prizePool: points,
       ratingType: ratingTypeEnum,
      championshipId: positiveInt.nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(cups).values(input).returning()
    ),

  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
      imageUrl: imageUrl.optional(),
      startDate: z.string().max(40).optional(),
      endDate: z.string().max(40).optional(),
      prizePool: points.optional(),
       ratingType: ratingTypeEnum.optional(),
      championshipId: positiveInt.nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(cups).set(input).where(eq(cups.id, input.id)).returning(),
        "Cup",
      )
    ),

  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(cups).where(eq(cups.id, input.id)).returning({ id: cups.id }),
        "Cup",
      )
    ),
});
