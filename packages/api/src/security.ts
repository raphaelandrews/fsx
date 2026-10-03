import { env } from "@fsx/env/server";

import { isTrustedOrigin } from "./request-origin";

export function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    request.headers.get("X-Real-IP") ||
    "127.0.0.1"
  );
}

export function isTrustedRequest(request: Request, options?: { requireOrigin?: boolean }): boolean {
  return isTrustedOrigin({
    origin: request.headers.get("Origin"),
    requestUrl: request.url,
    configuredOrigin: env.CORS_ORIGIN,
    requireOrigin: options?.requireOrigin,
  });
}

export interface RateLimitConfig {
  binding: "PUBLIC_READ_RATE_LIMIT" | "AUTH_MUTATION_RATE_LIMIT" | "AUTH_READ_RATE_LIMIT" | "TRPC_MUTATION_RATE_LIMIT";
  limit: number;
  period: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
}

// Each entry mirrors a RateLimit binding in packages/infra/alchemy.run.ts.
export const RATE_LIMITS = {
  uncachedRead: { binding: "PUBLIC_READ_RATE_LIMIT", limit: 600, period: 60 },
  authMutation: { binding: "AUTH_MUTATION_RATE_LIMIT", limit: 20, period: 60 },
  authQuery: { binding: "AUTH_READ_RATE_LIMIT", limit: 120, period: 60 },
  trpcMutation: { binding: "TRPC_MUTATION_RATE_LIMIT", limit: 300, period: 60 },
} as const satisfies Record<string, RateLimitConfig>;

// Cloudflare's native limiter keeps request checks off D1, whose daily write
// quota is reserved for admin edits. Counters are per location and approximate,
// which still stops a single client hammering an endpoint.
export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const limiter: RateLimit | undefined = env[config.binding];
  const { success } = limiter ? await limiter.limit({ key }) : { success: true };
  return {
    ok: success,
    limit: config.limit,
    remaining: 0,
    retryAfter: config.period,
  };
}

export function limitUncachedRead(request: Request): Promise<RateLimitResult> {
  return rateLimit(`trpc-read:${getClientIp(request)}`, RATE_LIMITS.uncachedRead);
}

export function rateLimitedResponse(result: RateLimitResult): Response {
  const response = new Response(
    JSON.stringify({ error: "Too many requests, please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
  return response;
}
