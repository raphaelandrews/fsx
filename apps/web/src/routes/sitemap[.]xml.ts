import { createFileRoute } from "@tanstack/react-router";

import { createContext } from "@fsx/api/context";
import { appRouter } from "@fsx/api/routers/index";

import { renderSitemap } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = await createContext({ req: request });
        const { posts, playerIds } = await appRouter.createCaller(ctx).sitemap.entries();

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
