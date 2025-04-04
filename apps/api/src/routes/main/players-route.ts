import { eq, desc } from 'drizzle-orm';
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from 'zod';

import { db } from "@/src/db";
import { players } from "@/src/db/schema";

const playersRoute = new Hono();

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

const baseConfig = {
  columns: {
    id: true,
    name: true,
    nickname: true,
    blitz: true,
    rapid: true,
    classic: true,
    imageUrl: true,
  },
  with: {
    location: { columns: { name: true, flag: true } },
    defendingChampions: {
      columns: {},
      with: { championship: { columns: { name: true } } }
    },
    playersToTitles: {
      columns: {},
      with: { title: { columns: { title: true, shortTitle: true, type: true } } }
    }
  },
  where: eq(players.active, true)
};

playersRoute.get("/top-players", async (c) => {
  const [rapid, classic, blitz] = await Promise.all([
    db.query.players.findMany({ 
      ...baseConfig,
      orderBy: desc(players.rapid),
      limit: 10
    }),
    db.query.players.findMany({ 
      ...baseConfig,
      orderBy: desc(players.classic),
      limit: 10
    }),
    db.query.players.findMany({ 
      ...baseConfig,
      orderBy: desc(players.blitz),
      limit: 10
    })
  ]);

  return c.json({ topBlitz: blitz, topRapid: rapid, topClassic: classic });
});

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

  return c.json(playerById);
})

export default playersRoute;