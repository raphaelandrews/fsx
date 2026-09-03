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

// Short, no-SWR TTL. When the server self-fetches these public GETs on SSR it
// goes through the same Cache API; an SWR window (the old stale-while-revalidate
// = 1h) made the home page keep serving events/posts up to an hour after an
// admin edit. Without SWR, an entry only lives for CACHE_MAX_AGE and then
// always results in an origin re-read.
const CACHE_MAX_AGE = 60;

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
    if (cache && !authenticated) {
      const cached = await cache.match(request);
      if (cached) return cached;
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
      toCache.headers.set("Cache-Control", `public, max-age=${CACHE_MAX_AGE}`);
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
