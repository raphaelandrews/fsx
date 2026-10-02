import { createFileRoute } from "@tanstack/react-router";

import { dropFromEdge, edgeCache, isCachedEntryFresh, storeAtEdge, toClientResponse } from "@fsx/api/edge-cache";
import { getSitemapEntries } from "@fsx/api/sitemap";

import { renderSitemap } from "@/lib/sitemap";

const SITEMAP_TTL_SECONDS = 3600;
const CLIENT_CACHE_CONTROL = `public, max-age=${SITEMAP_TTL_SECONDS}`;

// Worker responses are not cached by s-maxage alone, so the sitemap is stored in
// the Cache API explicitly; it reads every active player and published post.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cache = edgeCache();
        const cached = await cache?.match(request);
        if (cached && isCachedEntryFresh(cached, SITEMAP_TTL_SECONDS)) {
          return toClientResponse(cached, CLIENT_CACHE_CONTROL);
        }
        if (cache && cached) dropFromEdge(cache, request);

        const body = renderSitemap(await getSitemapEntries());
        const response = new Response(body, {
          headers: {
            "Cache-Control": CLIENT_CACHE_CONTROL,
            "Content-Type": "application/xml; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        });
        if (cache) storeAtEdge(cache, request, body, response, SITEMAP_TTL_SECONDS);
        return response;
      },
    },
  },
});
