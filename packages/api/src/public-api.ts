import { and, asc, eq } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { players } from "@fsx/db/schema/players";
import { env } from "@fsx/env/server";

import { dropFromEdge, edgeCache, isCachedEntryFresh, storeAtEdge, toClientResponse } from "./edge-cache";
import { PUBLIC_API_HEADERS, PUBLIC_API_TTL_SECONDS, type PublicPlayer, type PublicPlayerDetail } from "./public-api-contract";
import { limitUncachedRead } from "./security";

export { PUBLIC_API_TTL_SECONDS, type PublicPlayer, type PublicPlayerDetail } from "./public-api-contract";

const PLAYERS_LIMIT = 20_000;
const TITLES_PER_PLAYER_LIMIT = 20;
const CLIENT_CACHE_CONTROL = `public, max-age=${PUBLIC_API_TTL_SECONDS}`;

function json(body: string, status: number, extra: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { ...PUBLIC_API_HEADERS, "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}

const notFound = () => ({ status: 404, data: { error: "Player not found" } });

const PLAYER_COLUMNS = {
  id: players.id,
  name: players.name,
  classic: players.classic,
  rapid: players.rapid,
  blitz: players.blitz,
};

export async function getPublicPlayers(db = createDb(env.DB)): Promise<PublicPlayer[]> {
  return db
    .select(PLAYER_COLUMNS)
    .from(players)
    .where(eq(players.active, true))
    .orderBy(asc(players.id))
    .limit(PLAYERS_LIMIT);
}

export async function getPublicPlayer(id: number, db = createDb(env.DB)): Promise<PublicPlayerDetail | undefined> {
  const row = await db.query.players.findFirst({
    where: and(eq(players.id, id), eq(players.active, true)),
    columns: { id: true, name: true, classic: true, rapid: true, blitz: true, birthDate: true },
    with: {
      club: { columns: { id: true, name: true } },
      playersToTitles: {
        columns: {},
        limit: TITLES_PER_PLAYER_LIMIT,
        with: { title: { columns: { name: true, shortName: true, type: true } } },
      },
    },
  });
  if (!row) return undefined;
  const { birthDate, playersToTitles, club, ...ratings } = row;
  const year = birthDate ? Number(birthDate.slice(0, 4)) : Number.NaN;
  return {
    ...ratings,
    birthYear: Number.isInteger(year) ? year : null,
    club: club ?? null,
    // FSX (internal) titles first, as on the profile page.
    titles: playersToTitles
      .map(({ title }) => ({ ...title, type: title.type as "internal" | "external" }))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "internal" ? -1 : 1)),
  };
}

// Shared by every v1 endpoint: CORS, one edge entry per path (query strings are
// ignored so they cannot bypass the cache), and the read rate limit on misses.
// 404s are cached too, so repeated lookups of a missing ID stay off D1.
async function servePublicJson(
  request: Request,
  path: string,
  load: () => Promise<{ status: number; data: unknown }>,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: PUBLIC_API_HEADERS });
  }

  const cacheKey = new Request(new URL(path, request.url));
  const cache = edgeCache();
  const cached = await cache?.match(cacheKey);
  if (cached && isCachedEntryFresh(cached, PUBLIC_API_TTL_SECONDS)) {
    return toClientResponse(cached, CLIENT_CACHE_CONTROL);
  }
  if (cache && cached) dropFromEdge(cache, cacheKey);

  const limit = await limitUncachedRead(request);
  if (!limit.ok) {
    console.warn("[security] rate limit exceeded", { scope: "public-api", retryAfter: limit.retryAfter });
    return json(JSON.stringify({ error: "Too many requests, please try again later." }), 429, {
      "Cache-Control": "no-store",
      "Retry-After": String(limit.retryAfter),
    });
  }

  const { status, data } = await load();
  const body = JSON.stringify(data);
  const response = json(body, status, { "Cache-Control": CLIENT_CACHE_CONTROL });
  if (cache) storeAtEdge(cache, cacheKey, body, response, PUBLIC_API_TTL_SECONDS);
  return response;
}

export function handlePublicPlayersRequest(request: Request): Promise<Response> {
  return servePublicJson(request, "/api/v1/players", async () => {
    const rows = await getPublicPlayers();
    if (rows.length >= PLAYERS_LIMIT) {
      console.warn("[resource] public players API hit its row cap", { limit: PLAYERS_LIMIT });
    }
    return { status: 200, data: { updatedAt: new Date().toISOString(), count: rows.length, players: rows } };
  });
}

export async function handlePublicPlayerRequest(request: Request, rawId: string): Promise<Response> {
  // Canonical positive integers only, so `007` and `7` cannot be two cache entries.
  if (!/^[1-9]\d{0,9}$/.test(rawId) || !Number.isSafeInteger(Number(rawId))) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: PUBLIC_API_HEADERS });
    return json(JSON.stringify(notFound().data), 404, { "Cache-Control": CLIENT_CACHE_CONTROL });
  }
  const id = Number(rawId);
  return servePublicJson(request, `/api/v1/players/${id}`, async () => {
    const player = await getPublicPlayer(id);
    return player ? { status: 200, data: { updatedAt: new Date().toISOString(), player } } : notFound();
  });
}
