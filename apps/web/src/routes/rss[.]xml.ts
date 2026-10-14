import { createFileRoute } from "@tanstack/react-router";

import { dropFromEdge, edgeCache, isCachedEntryFresh, storeAtEdge, toClientResponse } from "@fsx/api/cache/edge-cache";
import { getFeedRows } from "@fsx/api/http/feeds";

import { renderRss } from "@/lib/feeds";

const FEED_TTL_SECONDS = 600;
const CLIENT_CACHE_CONTROL = `public, max-age=${FEED_TTL_SECONDS}`;

// Stored in the Cache API like the sitemap, so feed readers polling every few
// minutes cost one small query per ten minutes per data center.
export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cache = edgeCache();
        const cached = await cache?.match(request);
        if (cached && isCachedEntryFresh(cached, FEED_TTL_SECONDS)) {
          return toClientResponse(cached, CLIENT_CACHE_CONTROL);
        }
        if (cache && cached) dropFromEdge(cache, request);

        const body = renderRss(await getFeedRows());
        const response = new Response(body, {
          headers: {
            "Cache-Control": CLIENT_CACHE_CONTROL,
            "Content-Type": "application/rss+xml; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        });
        if (cache) storeAtEdge(cache, request, body, response, FEED_TTL_SECONDS);
        return response;
      },
    },
  },
});
