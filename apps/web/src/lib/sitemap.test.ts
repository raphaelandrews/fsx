import { describe, expect, test } from "bun:test";

import { renderSitemap } from "./sitemap";

describe("renderSitemap", () => {
  test("includes static routes and encoded dynamic news and player URLs", () => {
    const sitemap = renderSitemap({
      posts: [{ slug: "xadrez & cultura", updatedAt: "2026-09-30T12:00:00Z" }],
      playerIds: [42],
      announcementIds: [7],
      clubIds: [3],
    });

    expect(sitemap).toContain("https://www.fsx.org.br/ratings");
    expect(sitemap).toContain("https://www.fsx.org.br/noticias/xadrez%20%26%20cultura");
    expect(sitemap).toContain("<lastmod>2026-09-30</lastmod>");
    expect(sitemap).toContain("https://www.fsx.org.br/jogadores/42");
    expect(sitemap).toContain("https://www.fsx.org.br/comunicados/7");
    expect(sitemap).toContain("https://www.fsx.org.br/recordes");
    expect(sitemap).toContain("https://www.fsx.org.br/clubes/3");
    expect(sitemap).toContain("</urlset>");
  });

  test("omits invalid modification dates", () => {
    const sitemap = renderSitemap({ posts: [{ slug: "noticia", updatedAt: "invalid" }], playerIds: [], announcementIds: [], clubIds: [] });

    expect(sitemap).not.toContain("<lastmod>");
  });
});
