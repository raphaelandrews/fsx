import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import {
  getProcedureCachePolicy,
  hasSessionCookie,
  isSuccessfulTrpcPayload,
  shouldCachePublicQuery,
} from "./cache-policy";
import { createContext } from "./context";
import { dropFromEdge, edgeCache, isCachedEntryFresh, storeAtEdge, toClientResponse } from "./edge-cache";
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

// Browsers must not keep API responses: React Query is the client-side cache,
// and the zone's Browser Cache TTL raises any shorter max-age (it turned
// max-age=0 into 4 hours). Only the stored edge entry carries s-maxage.
const CLIENT_CACHE_CONTROL = "no-store";

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

  // SSR calls the router in-process, so this cache only serves client-side
  // navigation. Admins carry a session cookie and always bypass it.
  const cache = edgeCache();
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
      return toClientResponse(cached, CLIENT_CACHE_CONTROL);
    }
    if (cached) dropFromEdge(cache, request);
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
  response.headers.set("Cache-Control", CLIENT_CACHE_CONTROL);
  if (!cacheable || response.status !== 200) return response;

  const responseText = await response.clone().text();
  const requestId = request.headers.get("cf-ray") ?? "unknown";
  const responseBytes = measureResponseBytes(responseText);
  console.info("[resource] public tRPC response", { procedure, requestId, responseBytes });
  if (responseBytes > PUBLIC_RESPONSE_SIZE_BUDGET_BYTES) {
    console.warn("[resource] public response size budget exceeded", {
      procedure,
      requestId,
      responseBytes,
      budgetBytes: PUBLIC_RESPONSE_SIZE_BUDGET_BYTES,
    });
  }

  if (!cache || !shouldCachePublicQuery({ method, status: response.status, authenticated, cacheable })) {
    return response;
  }
  let successfulPayload = false;
  try {
    successfulPayload = isSuccessfulTrpcPayload(JSON.parse(responseText));
  } catch {
    successfulPayload = false;
  }
  if (!successfulPayload) return response;

  console.info("[cache] public query", { outcome: "miss", procedure, requestId });
  storeAtEdge(cache, request, responseText, response, ttlSeconds);
  return response;
}
