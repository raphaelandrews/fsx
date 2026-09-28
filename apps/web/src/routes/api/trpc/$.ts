import { createContext } from "@fsx/api/context";
import { appRouter } from "@fsx/api/routers/index";
import {
  RATE_LIMITS,
  getClientIp,
  isTrustedRequest,
  rateLimit,
  rateLimitedResponse,
} from "@fsx/api/security";
import { applySecurityHeaders } from "@fsx/api/security-headers";
import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// Short TTL for public GETs. When the server self-fetches these on SSR it goes
// through the same Cache API, so this is what keeps the home page (hero/fresh
// posts, events, etc.) reflecting admin edits quickly for every visitor. The
// Cloudflare Cache API does not reliably honor `max-age` on the `match()` path,
// so we also store a fetch timestamp and treat an entry as a miss once it is
// older than its TTL — otherwise a hit could be served stale indefinitely
// (e.g. a new post staying off the hero for hours on other browsers).
const CACHE_TTL_DEFAULT_SECONDS = 60;
const CACHE_FETCHED_AT_HEADER = "x-cache-fetched-at";

// Near-static public reads change only through admin edits. Admins carry a
// session cookie and therefore bypass the edge cache entirely (see
// isAuthenticated), so a longer TTL never hides an edit from the editor; it
// only cuts origin load for anonymous visitors. Search stays short because its
// result set is ephemeral. A batched request uses the shortest matching TTL.
const PROCEDURE_TTL_SECONDS: Record<string, number> = {
  "players.search": 30,
  "players.byId": 120,
  "players.withFilters": 120,
  "players.list": 120,
  "players.page": 60,
  "topPlayers.list": 300,
  "circuits.list": 300,
  "clubs.list": 300,
  "locations.list": 300,
  "titles.list": 300,
};

function resolveTtlSeconds(request: Request): number {
  const procedures = new URL(request.url).pathname
    .replace(/^\/api\/trpc\//, "")
    .split(",");
  const explicit = procedures
    .map((procedure) => PROCEDURE_TTL_SECONDS[procedure])
    .filter((ttl): ttl is number => ttl !== undefined);
  return explicit.length > 0 ? Math.min(...explicit) : CACHE_TTL_DEFAULT_SECONDS;
}

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
  return (request.headers.get("cookie") ?? "").includes("session_token");
}

async function handler({ request }: { request: Request }) {
  const method = request.method;

  if (!isTrustedRequest(request)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "POST") {
    const result = await rateLimit(`trpc:${getClientIp(request)}`, RATE_LIMITS.trpcMutation);
    if (!result.ok) {
      const response = rateLimitedResponse(result);
      applySecurityHeaders(response.headers);
      return response;
    }
  }

  if (method === "GET") {
    const cache = (caches as any).default as Cache | undefined;
    const authenticated = isAuthenticated(request);
    const ttlSeconds = resolveTtlSeconds(request);
    if (cache && !authenticated) {
      const cached = await cache.match(request);
      if (cached && isCachedEntryFresh(cached, ttlSeconds)) return cached;
      if (cached) await cache.delete(request).catch(() => {});
    }

    const response = await fetchRequestHandler({
      req: request,
      router: appRouter,
      createContext,
      endpoint: "/api/trpc",
    });

    applySecurityHeaders(response.headers);

    if (response.status === 200 && cache && !authenticated) {
      const toCache = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      toCache.headers.set("Cache-Control", `public, max-age=${ttlSeconds}, must-revalidate`);
      toCache.headers.set(CACHE_FETCHED_AT_HEADER, String(Date.now()));
      await cache.put(request, toCache);
    }

    return response;
  }

  const response = await fetchRequestHandler({
    req: request,
    router: appRouter,
    createContext,
    endpoint: "/api/trpc",
  });

  applySecurityHeaders(response.headers);
  return response;
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
