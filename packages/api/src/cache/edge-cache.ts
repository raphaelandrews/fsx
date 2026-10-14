import { waitUntil } from "@fsx/env/server";

// The Cache API does not reliably honor max-age on match(), so stored entries
// carry their fetch time and count as misses once older than their TTL;
// otherwise a hit could be served stale indefinitely.
export const CACHE_FETCHED_AT_HEADER = "x-cache-fetched-at";

export function edgeCache(): Cache | undefined {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default;
}

export function isCachedEntryFresh(cached: Response, ttlSeconds: number): boolean {
  const fetchedAt = Number(cached.headers.get(CACHE_FETCHED_AT_HEADER) ?? 0);
  return fetchedAt > 0 && Date.now() - fetchedAt < ttlSeconds * 1000;
}

export function toClientResponse(cached: Response, cacheControl: string): Response {
  const headers = new Headers(cached.headers);
  headers.delete(CACHE_FETCHED_AT_HEADER);
  headers.set("Cache-Control", cacheControl);
  return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
}

export function storeAtEdge(cache: Cache, request: Request, body: string, source: Response, ttlSeconds: number) {
  const stored = new Response(body, {
    status: source.status,
    statusText: source.statusText,
    headers: new Headers(source.headers),
  });
  stored.headers.set("Cache-Control", `public, max-age=0, s-maxage=${ttlSeconds}`);
  stored.headers.set(CACHE_FETCHED_AT_HEADER, String(Date.now()));
  waitUntil(cache.put(request, stored).catch(() => {}));
}

export function dropFromEdge(cache: Cache, request: Request) {
  waitUntil(cache.delete(request).catch(() => false));
}
