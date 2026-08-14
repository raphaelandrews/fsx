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

const CACHE_MAX_AGE = 300;
const CACHE_SWR = 3600;

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
    if (cache) {
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

    if (response.status === 200 && cache) {
      const toCache = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      toCache.headers.set(
        "Cache-Control",
        `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_SWR}`,
      );
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
