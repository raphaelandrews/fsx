import { createDb } from "@fsx/db";
import { env } from "@fsx/env/server";
import { sql } from "drizzle-orm";

export function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    request.headers.get("X-Real-IP") ||
    "127.0.0.1"
  );
}

export function isTrustedRequest(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  const selfOrigin = new URL(request.url).origin;
  return origin === selfOrigin || origin === env.CORS_ORIGIN;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
}

export const RATE_LIMITS = {
  authMutation: { windowMs: 60_000, max: 20 },
  authQuery: { windowMs: 60_000, max: 120 },
  trpcMutation: { windowMs: 60_000, max: 300 },
} as const;

let tableReady: Promise<void> | null = null;

function ensureRateLimitTable(): Promise<void> {
  if (!tableReady) {
    tableReady = createDb(env.DB)
      .run(sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT NOT NULL,
          window_start INTEGER NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (key, window_start)
        )
      `)
      .then(() => undefined);
  }
  return tableReady;
}

export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  await ensureRateLimitTable();

  const db = createDb(env.DB);
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const resetAt = windowStart + config.windowMs;

  const row = await db.get(
    sql`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
      RETURNING count
    `,
  );

  const count = (row as { count?: number } | undefined)?.count ?? 1;
  const remaining = Math.max(0, config.max - count);
  const ok = count <= config.max;
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));

  if (Math.random() < 0.02) {
    void db.run(sql`DELETE FROM rate_limits WHERE window_start < ${now - 600_000}`).catch(() => {});
  }

  return { ok, limit: config.max, remaining, retryAfter };
}

export function rateLimitedResponse(result: RateLimitResult): Response {
  const response = new Response(
    JSON.stringify({ error: "Too many requests, please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
  return response;
}
