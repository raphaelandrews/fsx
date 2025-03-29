import { Hono } from "hono";

import { db } from "@/src/db";
import { tournaments } from "@/src/db/schema";

const tournamentsRoute = new Hono();

tournamentsRoute.get("/top-ten-tournaments", async (c) => {
  const topTenTournaments = await db
    .select()
    .from(tournaments)
    .limit(10)
  return c.json(topTenTournaments);
})

export default tournamentsRoute;
