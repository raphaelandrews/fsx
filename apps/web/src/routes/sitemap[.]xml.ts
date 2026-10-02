import { createFileRoute } from "@tanstack/react-router";

import { getSitemapEntries } from "@fsx/api/sitemap";

import { renderSitemap } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { posts, playerIds } = await getSitemapEntries();

        return new Response(
          renderSitemap(posts, playerIds),
          {
            headers: {
              "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=3600",
              "Content-Type": "application/xml; charset=utf-8",
              "X-Content-Type-Options": "nosniff",
            },
          },
        );
      },
    },
  },
});
