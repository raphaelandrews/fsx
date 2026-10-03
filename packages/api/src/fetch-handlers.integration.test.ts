import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";
import { session } from "@fsx/db/schema/auth";

import { insertGithubUser } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { flushWaitUntil, mockWorkerEnv, TEST_OWNER_GITHUB_ID, testEnv } from "./test-env";

mockWorkerEnv();

const { handleTrpcRequest } = await import("./trpc-handler");
const { handleMediaRequest } = await import("./media-handler");

const ORIGIN = "http://localhost:3001";
const MEDIA_KEY = "players/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0.webp";

let dispose: () => Promise<void>;
let ownerCookie: string;
let impostorCookie: string;

// Mirrors better-call's signCookieValue: HMAC-SHA256(token) appended as base64.
async function sessionCookie(db: ReturnType<typeof createDb>, userId: string): Promise<string> {
  const token = `${userId}-token`;
  await db.insert(session).values({
    id: `${userId}-session`,
    token,
    userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(testEnv.BETTER_AUTH_SECRET)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  const encoded = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `better-auth.session_token=${encodeURIComponent(`${token}.${encoded}`)}`;
}
let limiterCalls: string[] = [];
let limiterAllows = true;

beforeAll(async () => {
  const { miniflare, binding, images } = await createTestD1("fsx-fetch-handlers");
  await images.put(MEDIA_KEY, new Uint8Array([0x52, 0x49, 0x46, 0x46]), {
    httpMetadata: { contentType: "image/webp" },
  });
  testEnv.DB = binding;
  // Touching `body` (or `in`) on Miniflare's proxied R2 objects throws a
  // DataCloneError under Bun; workerd has no such limit, so only the test
  // copies objects into plain values.
  testEnv.IMAGES = {
    get: async (key: string, options?: R2GetOptions) => {
      const object = await images.get(key, options);
      if (!object) return null;
      const metadata = {
        httpEtag: object.httpEtag,
        writeHttpMetadata: (headers: Headers) => object.writeHttpMetadata(headers),
      };
      const { arrayBuffer } = object as Partial<R2ObjectBody>;
      if (typeof arrayBuffer !== "function") return metadata;
      return { ...metadata, body: new Blob([await arrayBuffer.call(object)]).stream() };
    },
  };
  const limiter = {
    limit: async ({ key }: { key: string }) => {
      limiterCalls.push(key);
      return { success: limiterAllows };
    },
  };
  testEnv.PUBLIC_READ_RATE_LIMIT = limiter;
  testEnv.TRPC_MUTATION_RATE_LIMIT = limiter;
  dispose = () => miniflare.dispose();

  const db = createDb(binding);
  await insertGithubUser(db, "owner-id", "owner", TEST_OWNER_GITHUB_ID);
  await insertGithubUser(db, "impostor-id", "owner", "2002");
  ownerCookie = await sessionCookie(db, "owner-id");
  impostorCookie = await sessionCookie(db, "impostor-id");
});

afterAll(async () => {
  delete testEnv.PUBLIC_READ_RATE_LIMIT;
  delete testEnv.TRPC_MUTATION_RATE_LIMIT;
  delete (globalThis as { caches?: unknown }).caches;
  await dispose();
});

beforeEach(() => {
  limiterCalls = [];
  limiterAllows = true;
  delete (globalThis as { caches?: unknown }).caches;
});

function trpcGet(path: string, headers: Record<string, string> = {}) {
  return handleTrpcRequest(new Request(`${ORIGIN}/api/trpc/${path}`, {
    headers: { "CF-Connecting-IP": "203.0.113.7", ...headers },
  }));
}

type StoredEntry = { url: string; cacheControl: string | null; fetchedAt: string | null; body: string };

function recordingCache(hit?: Response) {
  const stored: StoredEntry[] = [];
  const deleted: string[] = [];
  (globalThis as { caches?: unknown }).caches = {
    default: {
      match: async () => hit,
      delete: async (request: Request) => {
        deleted.push(request.url);
        return true;
      },
      put: async (request: Request, response: Response) => {
        stored.push({
          url: request.url,
          cacheControl: response.headers.get("Cache-Control"),
          fetchedAt: response.headers.get("x-cache-fetched-at"),
          body: await response.text(),
        });
      },
    },
  };
  return { stored, deleted };
}

describe("tRPC fetch handler", () => {
  test("stores anonymous public reads at the edge but tells browsers not to cache", async () => {
    const { stored } = recordingCache();
    const response = await trpcGet("norms.list");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("x-cache-fetched-at")).toBeNull();
    await flushWaitUntil();
    expect(stored).toHaveLength(1);
    expect(stored[0]!.cacheControl).toBe("public, max-age=0, s-maxage=300");
    expect(Number(stored[0]!.fetchedAt)).toBeGreaterThan(0);
    expect(stored[0]!.body).toBe(await response.text());
    expect(limiterCalls).toEqual(["trpc-read:203.0.113.7"]);
  });

  test("rejects uncached reads over the limit with Retry-After", async () => {
    limiterAllows = false;
    const response = await trpcGet("norms.list");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  test("limits reads that bypass the cache with a forged session cookie", async () => {
    limiterAllows = false;
    const response = await trpcGet("norms.list", {
      cookie: "better-auth.session_token=forged",
    });
    expect(response.status).toBe(429);
  });

  test("strips internal headers from cache hits and drops expired entries in the background", async () => {
    const fresh = recordingCache(new Response("[]", {
      headers: { "x-cache-fetched-at": String(Date.now()), "Cache-Control": "public, max-age=14400" },
    }));
    const hit = await trpcGet("norms.list");
    expect(await hit.text()).toBe("[]");
    expect(hit.headers.get("x-cache-fetched-at")).toBeNull();
    expect(hit.headers.get("Cache-Control")).toBe("no-store");
    expect(fresh.deleted).toEqual([]);

    const expired = recordingCache(new Response("[]", {
      headers: { "x-cache-fetched-at": String(Date.now() - 301_000) },
    }));
    const miss = await trpcGet("norms.list");
    expect(await miss.text()).not.toBe("[]");
    await flushWaitUntil();
    expect(expired.deleted).toHaveLength(1);
    expect(expired.stored).toHaveLength(1);
  });

  test("serves fresh edge cache hits without touching the limiter", async () => {
    (globalThis as { caches?: unknown }).caches = {
      default: {
        match: async () => new Response("[]", {
          headers: { "x-cache-fetched-at": String(Date.now()) },
        }),
        delete: async () => true,
        put: async () => {},
      },
    };
    limiterAllows = false;
    const response = await trpcGet("norms.list");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("[]");
    expect(limiterCalls).toEqual([]);
  });

  test("never caches failed public queries", async () => {
    const puts: string[] = [];
    (globalThis as { caches?: unknown }).caches = {
      default: {
        match: async () => undefined,
        delete: async () => true,
        put: async (request: Request) => {
          puts.push(request.url);
        },
      },
    };
    const response = await trpcGet(`players.byId?input=${encodeURIComponent(JSON.stringify({ id: 999_999 }))}`);
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(puts).toEqual([]);
  });

  test("no longer exposes sitemap entries as a public procedure", async () => {
    const response = await trpcGet("sitemap.entries");
    expect(response.status).toBe(404);
  });

  test("requires a trusted Origin for mutations", async () => {
    const response = await handleTrpcRequest(new Request(`${ORIGIN}/api/trpc/norms.create`, {
      method: "POST",
      body: JSON.stringify({ name: "x" }),
    }));
    expect(response.status).toBe(403);
  });
});

describe("tRPC fetch handler: batching and sessions", () => {
  function stubCache() {
    const puts: string[] = [];
    (globalThis as { caches?: unknown }).caches = {
      default: {
        match: async () => new Response('[{"result":{"data":"stale"}}]', {
          headers: { "x-cache-fetched-at": String(Date.now()) },
        }),
        delete: async () => true,
        put: async (request: Request) => {
          puts.push(new URL(request.url).pathname);
        },
      },
    };
    return puts;
  }

  test("caches a public batch with the shortest member TTL", async () => {
    const { stored } = recordingCache();
    const response = await trpcGet("norms.list,events.list?batch=1&input=%7B%7D");
    expect(response.status).toBe(200);
    await flushWaitUntil();
    expect(stored[0]?.cacheControl).toBe("public, max-age=0, s-maxage=60");
    const body = (await response.json()) as unknown[];
    expect(body).toHaveLength(2);
  });

  test("never caches a batch that contains an admin procedure", async () => {
    const response = await trpcGet("norms.list,stats.counts?batch=1&input=%7B%7D");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.status).toBe(207);
    const [publicResult, adminResult] = (await response.json()) as [
      { result?: unknown },
      { error?: { json?: { data?: { code?: string } }; data?: { code?: string } } },
    ];
    expect(publicResult.result).toBeDefined();
    expect(adminResult.error?.data?.code ?? adminResult.error?.json?.data?.code).toBe("UNAUTHORIZED");
  });

  test("authenticated reads bypass the edge cache and are never stored", async () => {
    const puts = stubCache();
    const response = await trpcGet("norms.list", { cookie: ownerCookie });
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("stale");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(puts).toEqual([]);
  });

  test("admin procedures accept the owner session and reject other accounts over HTTP", async () => {
    const owner = await trpcGet("stats.counts", { cookie: ownerCookie });
    expect(owner.status).toBe(200);
    expect(owner.headers.get("Cache-Control")).toBe("no-store");

    const impostor = await trpcGet("stats.counts", { cookie: impostorCookie });
    expect(impostor.status).toBe(403);

    const forged = await trpcGet("stats.counts", { cookie: "better-auth.session_token=forged.signature" });
    expect(forged.status).toBe(401);
  });

  test("mutations from the trusted origin succeed for the owner and are not cacheable", async () => {
    const response = await handleTrpcRequest(new Request(`${ORIGIN}/api/trpc/norms.create`, {
      method: "POST",
      headers: { Origin: ORIGIN, cookie: ownerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Norma via HTTP" }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const anonymous = await handleTrpcRequest(new Request(`${ORIGIN}/api/trpc/norms.create`, {
      method: "POST",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Anônimo" }),
    }));
    expect(anonymous.status).toBe(401);
  });

  test("rejects mutations over the limit before running them", async () => {
    limiterAllows = false;
    const response = await handleTrpcRequest(new Request(`${ORIGIN}/api/trpc/norms.create`, {
      method: "POST",
      headers: { Origin: ORIGIN, cookie: ownerCookie, "CF-Connecting-IP": "203.0.113.7", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Norma limitada" }),
    }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(limiterCalls).toEqual(["trpc:203.0.113.7"]);
  });
});

describe("media fetch handler", () => {
  test("returns 404 for malformed escapes and traversal instead of throwing", async () => {
    for (const path of ["%E0%A4%A", "players/..%2F..%2Fsecret"]) {
      const response = await handleMediaRequest(new Request(`${ORIGIN}/api/media/${path}`));
      expect(response.status).toBe(404);
    }
  });

  test("serves objects and answers matching If-None-Match with 304", async () => {
    const first = await handleMediaRequest(new Request(`${ORIGIN}/api/media/${MEDIA_KEY}`));
    expect(first.status).toBe(200);
    expect(first.headers.get("Content-Type")).toBe("image/webp");
    // Uploaded SVGs open as sandboxed documents if visited directly.
    expect(first.headers.get("Content-Security-Policy")).toContain("sandbox");
    expect(first.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    const etag = first.headers.get("ETag");
    expect(etag).toBeTruthy();

    const revalidated = await handleMediaRequest(new Request(`${ORIGIN}/api/media/${MEDIA_KEY}`, {
      headers: { "If-None-Match": etag! },
    }));
    expect(revalidated.status).toBe(304);
    expect(await revalidated.text()).toBe("");

    const missing = await handleMediaRequest(new Request(`${ORIGIN}/api/media/players/missing.webp`));
    expect(missing.status).toBe(404);
  });
});
