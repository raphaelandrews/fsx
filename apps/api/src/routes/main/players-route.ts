import { championships } from './../../db/schema/championships';
import { eq, desc, sql } from 'drizzle-orm';
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from 'zod';

import { db } from "@/src/db";
import { clubs, defendingChampions, locations, players, playersToRoles, playersToTitles, playersToTournaments, roles, titles, tournamentPodiums, tournaments } from "@/src/db/schema";

const playersRoute = new Hono();

playersRoute.get("/top-ten-players", async (c) => {
  const topTenPlayers = await db
    .select()
    .from(players)
    .limit(10)
  return c.json(topTenPlayers);
})

playersRoute.get("/search-players", async (c) => {
  const searchPlayers = await db
    .select({
      id: players.id,
      name: players.name
    })
    .from(players)
    .orderBy(desc(players.rapid))

  return c.json(searchPlayers);
})

playersRoute.get("/:id", zValidator("param", z.object({ id: z.string().optional() })), async (c) => {
  const { id } = c.req.valid("param");

  if (!id) {
    return c.json({ error: "Missing id" }, 400)
  }

  const playerId = Number(id);
  if (Number.isNaN(playerId)) {
    return c.json({ error: "Invalid id" }, 400);
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
        columns: {
          id: false,
          playerId: false,
          championshipId: false
        },
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
      }
    },
  })

  return c.json(playerById);
})

export default playersRoute;