import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { handleTrpcRequest } = await import("./trpc-handler");
const { handleMediaRequest } = await import("./media-handler");

const ORIGIN = "http://localhost:3001";
const MEDIA_KEY = "players/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0.webp";

let dispose: () => Promise<void>;
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
  testEnv.PUBLIC_READ_RATE_LIMIT = {
    limit: async ({ key }: { key: string }) => {
      limiterCalls.push(key);
      return { success: limiterAllows };
    },
  };
  dispose = () => miniflare.dispose();
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

function trpcGet(path: string, headers: Record<string, string> = {}) {
  return handleTrpcRequest(new Request(`${ORIGIN}/api/trpc/${path}`, {
    headers: { "CF-Connecting-IP": "203.0.113.7", ...headers },
  }));
}

describe("tRPC fetch handler", () => {
  test("serves anonymous public reads with edge cache headers and counts them", async () => {
    const response = await trpcGet("norms.list");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
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
