import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";
import { clubs } from "@fsx/db/schema/clubs";
import { players } from "@fsx/db/schema/players";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { titles } from "@fsx/db/schema/titles";

import { createTestD1 } from "./test-d1";
import { flushWaitUntil, mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { handlePublicPlayerRequest, handlePublicPlayersRequest } = await import("./public-api");
type PublicPlayer = import("./public-api").PublicPlayer;
type PublicPlayerDetail = import("./public-api").PublicPlayerDetail;

const URL_BASE = "https://fsx.example/api/v1/players";
let dispose: () => Promise<void>;
let limiterCalls: string[] = [];
let limiterAllows = true;
let activeId = 0;
let inactiveId = 0;
let bareId = 0;
let clubId = 0;

function get(url = URL_BASE) {
  return handlePublicPlayersRequest(new Request(url, {
    headers: { Origin: "https://clube.example", "CF-Connecting-IP": "203.0.113.9" },
  }));
}

function recordingCache(hit?: Response) {
  const stored: Array<{ url: string; body: string }> = [];
  (globalThis as { caches?: unknown }).caches = {
    default: {
      match: async () => hit,
      delete: async () => true,
      put: async (request: Request, response: Response) => {
        stored.push({ url: request.url, body: await response.text() });
      },
    },
  };
  return stored;
}

beforeAll(async () => {
  const { miniflare, binding } = await createTestD1("fsx-public-api");
  testEnv.DB = binding;
  testEnv.PUBLIC_READ_RATE_LIMIT = {
    limit: async ({ key }: { key: string }) => {
      limiterCalls.push(key);
      return { success: limiterAllows };
    },
  };
  dispose = () => miniflare.dispose();

  const db = createDb(binding);
  const [club] = await db.insert(clubs).values({ name: "Clube Público" }).returning({ id: clubs.id });
  clubId = club!.id;
  const inserted = await db.insert(players).values([
    { name: "Ana Ativa", normalizedName: "ana ativa", active: true, classic: 2010, rapid: 1990, blitz: 1950, birthDate: "2010-04-17", cbxId: 123, clubId },
    { name: "Bruno Inativo", normalizedName: "bruno inativo", active: false },
    { name: "Caio Sem Dados", normalizedName: "caio sem dados", active: true },
  ]).returning({ id: players.id });
  activeId = inserted[0]!.id;
  inactiveId = inserted[1]!.id;
  bareId = inserted[2]!.id;
  const titleRows = await db.insert(titles).values([
    { name: "Mestre FIDE", shortName: "MF", type: "external" },
    { name: "Mestre Sergipano", shortName: "MSE", type: "internal" },
  ]).returning({ id: titles.id });
  await db.insert(playersToTitles).values(titleRows.map(({ id }) => ({ playerId: activeId, titleId: id })));
});

afterAll(async () => {
  delete testEnv.PUBLIC_READ_RATE_LIMIT;
  delete (globalThis as { caches?: unknown }).caches;
  await dispose();
});

beforeEach(() => {
  limiterCalls = [];
  limiterAllows = true;
  delete (globalThis as { caches?: unknown }).caches;
});

describe("GET /api/v1/players", () => {
  test("serves active players' ids, names, and ratings to any origin", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("cross-origin");
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");

    const body = (await response.json()) as { updatedAt: string; count: number; players: PublicPlayer[] };
    expect(body).toEqual({
      updatedAt: expect.any(String),
      count: 2,
      players: [
        { id: activeId, name: "Ana Ativa", classic: 2010, rapid: 1990, blitz: 1950 },
        { id: bareId, name: "Caio Sem Dados", classic: 1900, rapid: 1900, blitz: 1900 },
      ],
    });
    expect(Object.keys(body.players[0]!).sort()).toEqual(["blitz", "classic", "id", "name", "rapid"]);
  });

  test("answers CORS preflight without touching the database or the limiter", async () => {
    const response = await handlePublicPlayersRequest(new Request(URL_BASE, { method: "OPTIONS" }));
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
    expect(limiterCalls).toEqual([]);
  });

  test("stores one edge entry regardless of the query string", async () => {
    const stored = recordingCache();
    await get(`${URL_BASE}?cachebuster=${Math.random()}`);
    await flushWaitUntil();
    expect(stored).toHaveLength(1);
    expect(stored[0]!.url).toBe(URL_BASE);
    expect(limiterCalls).toEqual(["trpc-read:203.0.113.9"]);
  });

  test("serves fresh edge hits without the limiter", async () => {
    recordingCache(new Response('{"cached":true}', {
      headers: { "x-cache-fetched-at": String(Date.now()), "Content-Type": "application/json" },
    }));
    limiterAllows = false;
    const response = await get();
    expect(await response.text()).toBe('{"cached":true}');
    expect(response.headers.get("x-cache-fetched-at")).toBeNull();
    expect(limiterCalls).toEqual([]);
  });

  test("rate-limits cache misses with a CORS-readable 429", async () => {
    limiterAllows = false;
    const response = await get();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("GET /api/v1/players/{id}", () => {
  const getOne = (id: string, method = "GET") =>
    handlePublicPlayerRequest(
      new Request(`${URL_BASE}/${id}`, { method, headers: { Origin: "https://clube.example", "CF-Connecting-IP": "203.0.113.9" } }),
      id,
    );

  test("returns one active player with ratings, birth year, club, and titles", async () => {
    const response = await getOne(String(activeId));
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const text = await response.text();
    // Only the year is public; the full date never leaves the server.
    expect(text).not.toContain("2010-04-17");
    expect(JSON.parse(text)).toEqual({
      updatedAt: expect.any(String),
      player: {
        id: activeId,
        name: "Ana Ativa",
        classic: 2010,
        rapid: 1990,
        blitz: 1950,
        birthYear: 2010,
        club: { id: clubId, name: "Clube Público" },
        titles: [
          { name: "Mestre Sergipano", shortName: "MSE", type: "internal" },
          { name: "Mestre FIDE", shortName: "MF", type: "external" },
        ],
      },
    });
  });

  test("returns null birth year and club, and no titles, when the player has none", async () => {
    const body = (await (await getOne(String(bareId))).json()) as { player: PublicPlayerDetail };
    expect(body.player).toMatchObject({ birthYear: null, club: null, titles: [] });
  });

  test("answers 404 for inactive and unknown players, readable cross-origin and cached", async () => {
    const stored = recordingCache();
    for (const id of [String(inactiveId), "999999"]) {
      const response = await getOne(id);
      expect(response.status).toBe(404);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(await response.text()).toBe(JSON.stringify({ error: "Player not found" }));
    }
    await flushWaitUntil();
    expect(stored.map(({ url }) => url)).toEqual([`${URL_BASE}/${inactiveId}`, `${URL_BASE}/999999`]);
  });

  test("rejects malformed IDs without reaching the limiter or the database", async () => {
    for (const id of ["abc", "0", "007", "-1", "1.5", "99999999999"]) {
      const response = await getOne(id);
      expect(response.status).toBe(404);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    }
    expect((await getOne("abc", "OPTIONS")).status).toBe(204);
    expect(limiterCalls).toEqual([]);
  });
});

describe("OpenAPI document", () => {
  test("describes exactly the fields and statuses the handlers return", async () => {
    const { OPENAPI_DOCUMENT } = await import("./openapi");
    const { schemas } = OPENAPI_DOCUMENT.components;

    const list = (await (await get()).json()) as Record<string, unknown> & { players: PublicPlayer[] };
    expect(Object.keys(list).sort()).toEqual([...schemas.PlayerList.required].sort());
    expect(Object.keys(list.players[0]!).sort()).toEqual([...schemas.Player.required].sort());
    expect(Object.keys(schemas.Player.properties).sort()).toEqual([...schemas.Player.required].sort());

    const one = (await (await handlePublicPlayerRequest(new Request(`${URL_BASE}/${activeId}`), String(activeId))).json()) as Record<string, unknown> & { player: PublicPlayerDetail };
    expect(Object.keys(one).sort()).toEqual([...schemas.PlayerResponse.required].sort());
    expect(Object.keys(one.player).sort()).toEqual([...schemas.PlayerDetail.required].sort());
    expect(Object.keys(schemas.PlayerDetail.properties).sort()).toEqual([...schemas.PlayerDetail.required].sort());
    expect(Object.keys(one.player.titles[0]!).sort()).toEqual([...schemas.PlayerDetail.properties.titles.items.required].sort());
    expect(Object.keys(one.player.club!).sort()).toEqual([...schemas.PlayerDetail.properties.club.required].sort());

    expect(Object.keys(OPENAPI_DOCUMENT.paths).sort()).toEqual(["/api/v1/players", "/api/v1/players/{id}"]);
    expect(Object.keys(OPENAPI_DOCUMENT.paths["/api/v1/players"].get.responses).sort()).toEqual(["200", "429"]);
    expect(Object.keys(OPENAPI_DOCUMENT.paths["/api/v1/players/{id}"].get.responses).sort()).toEqual(["200", "404", "429"]);
  });

  test("is served as cacheable JSON that any origin can read", async () => {
    const { handleOpenApiRequest } = await import("./openapi");
    const response = handleOpenApiRequest(new Request("https://fsx.example/api/v1/openapi.json"));
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    expect(((await response.json()) as { openapi: string }).openapi).toBe("3.1.0");
    expect(limiterCalls).toEqual([]);
  });
});
