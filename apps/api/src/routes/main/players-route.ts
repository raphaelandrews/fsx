import { desc } from 'drizzle-orm';
import { Hono } from "hono";

import { db } from "@/src/db";
import { players } from "@/src/db/schema";

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

export default playersRoute;
