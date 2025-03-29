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

export default playersRoute;
