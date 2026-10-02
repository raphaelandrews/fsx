import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import {
  getProcedureCachePolicy,
  hasSessionCookie,
  isSuccessfulTrpcPayload,
  shouldCachePublicQuery,
} from "./cache-policy";
import { createContext } from "./context";
import { measureResponseBytes, PUBLIC_RESPONSE_SIZE_BUDGET_BYTES } from "./resource-bounds";
import { appRouter } from "./routers/index";
import {
  getClientIp,
  isTrustedRequest,
  limitUncachedRead,
  RATE_LIMITS,
  rateLimit,
  rateLimitedResponse,
} from "./security";
import { applySecurityHeaders } from "./security-headers";

// Short TTL for public GETs, cached in the Cloudflare Cache API and served to
// the browser on client-side navigation. SSR does not go through this route —
// it calls the router in-process (see apps/web/src/router.tsx) — so this cache
// only affects client fetches, and keeps the home page (hero/fresh posts,
// events, etc.) reflecting admin edits quickly. The Cache API does not reliably
// honor `max-age` on the `match()` path, so we also store a fetch timestamp and
// treat an entry as a miss once it is older than its TTL — otherwise a hit
// could be served stale indefinitely (e.g. a new post staying off the hero).
const CACHE_FETCHED_AT_HEADER = "x-cache-fetched-at";

// Near-static public reads change only through admin edits. Admins carry a
// session cookie and therefore bypass the edge cache entirely (see
// isAuthenticated), so a longer TTL never hides an edit from the editor; it
// only cuts origin load for anonymous visitors. Search stays short because its
// result set is ephemeral. A batched request uses the shortest matching TTL.
function isCachedEntryFresh(cached: Response, ttlSeconds: number): boolean {
  const fetchedAt = Number(cached.headers.get(CACHE_FETCHED_AT_HEADER) ?? 0);
  return fetchedAt > 0 && Date.now() - fetchedAt < ttlSeconds * 1000;
}

// A session cookie means the request is authenticated. Cache API entries are
// keyed by URL + method only, so caching authenticated GETs would both serve
// stale data to admins after a mutation AND leak protected procedure output to
// unauthenticated callers (the cache is read before tRPC auth middleware runs).
// Skip the edge cache entirely for cookie-bearing requests; they go to origin.
function isAuthenticated(request: Request): boolean {
  return hasSessionCookie(request.headers.get("cookie") ?? "");
}

function requestIdOf(request: Request): string {
  return request.headers.get("cf-ray") ?? crypto.randomUUID();
}

function forbidden(): Response {
  const response = new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  applySecurityHeaders(response.headers);
  return response;
}

function handleWithRouter(request: Request): Promise<Response> {
  return fetchRequestHandler({
    req: request,
    router: appRouter,
    createContext,
    endpoint: "/api/trpc",
  });
}

export async function handleTrpcRequest(request: Request): Promise<Response> {
  const method = request.method;

  if (!isTrustedRequest(request, { requireOrigin: method === "POST" })) {
    return forbidden();
  }

  if (method === "POST") {
    const result = await rateLimit(`trpc:${getClientIp(request)}`, RATE_LIMITS.trpcMutation);
    if (!result.ok) {
      console.warn("[security] rate limit exceeded", {
        scope: "trpc-mutation",
        requestId: requestIdOf(request),
        retryAfter: result.retryAfter,
      });
      const response = rateLimitedResponse(result);
      applySecurityHeaders(response.headers);
      return response;
    }

    const response = await handleWithRouter(request);
    response.headers.set("Cache-Control", "no-store");
    applySecurityHeaders(response.headers);
    return response;
  }

  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const authenticated = isAuthenticated(request);
  const pathname = new URL(request.url).pathname;
  const procedure = pathname.replace("/api/trpc/", "");
  const cachePolicy = getProcedureCachePolicy(pathname);
  const ttlSeconds = cachePolicy.ttlSeconds;
  const cacheable = cachePolicy.classification === "public";
  if (cache && cacheable && !authenticated) {
    const cached = await cache.match(request);
    if (cached && isCachedEntryFresh(cached, ttlSeconds)) {
      console.info("[cache] public query", {
        outcome: "hit",
        procedure,
        requestId: request.headers.get("cf-ray") ?? "unknown",
      });
      return cached;
    }
    if (cached) await cache.delete(request).catch(() => {});
  }

  // Applies to cookie-bearing GETs too: the cookie check only looks at the
  // cookie name, so a forged cookie would otherwise bypass both cache and limit.
  const readLimit = await limitUncachedRead(request);
  if (!readLimit.ok) {
    console.warn("[security] rate limit exceeded", {
      scope: "trpc-read",
      procedure,
      requestId: requestIdOf(request),
    });
    const response = rateLimitedResponse(readLimit);
    applySecurityHeaders(response.headers);
    return response;
  }

  const response = await handleWithRouter(request);
  applySecurityHeaders(response.headers);

  let successfulPayload = false;
  let responseText = "";
  if (response.status === 200) {
    try {
      responseText = await response.clone().text();
      successfulPayload = isSuccessfulTrpcPayload(JSON.parse(responseText));
    } catch {
      successfulPayload = false;
    }
  }
  const responseBytes = measureResponseBytes(responseText);
  if (cacheable && response.status === 200) {
    const requestId = request.headers.get("cf-ray") ?? "unknown";
    console.info("[resource] public tRPC response", {
      procedure,
      requestId,
      responseBytes,
    });
    if (responseBytes > PUBLIC_RESPONSE_SIZE_BUDGET_BYTES) {
      console.warn("[resource] public response size budget exceeded", {
        procedure,
        requestId,
        responseBytes,
        budgetBytes: PUBLIC_RESPONSE_SIZE_BUDGET_BYTES,
      });
    }
    if (cache && !authenticated) {
      console.info("[cache] public query", {
        outcome: "miss",
        procedure,
        requestId,
      });
    }
  }
  const mayCache =
    shouldCachePublicQuery({ method, status: response.status, authenticated, cacheable }) &&
    successfulPayload;

  if (mayCache) {
    response.headers.set(
      "Cache-Control",
      `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`,
    );
  } else {
    response.headers.set("Cache-Control", "no-store");
  }

  if (mayCache && cache) {
    const toCache = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    toCache.headers.set(CACHE_FETCHED_AT_HEADER, String(Date.now()));
    await cache.put(request, toCache);
  }

  return response;
}
