import { describe, expect, test } from "bun:test";

import { renderSitemap } from "./sitemap";

describe("renderSitemap", () => {
  test("includes static routes and encoded dynamic news and player URLs", () => {
    const sitemap = renderSitemap([{ slug: "xadrez & cultura", updatedAt: "2026-09-30T12:00:00Z" }], [42]);

    expect(sitemap).toContain("https://www.fsx.org.br/ratings");
    expect(sitemap).toContain("https://www.fsx.org.br/noticias/xadrez%20%26%20cultura");
    expect(sitemap).toContain("<lastmod>2026-09-30</lastmod>");
    expect(sitemap).toContain("https://www.fsx.org.br/jogadores/42");
    expect(sitemap).toContain("</urlset>");
  });

  test("omits invalid modification dates", () => {
    const sitemap = renderSitemap([{ slug: "noticia", updatedAt: "invalid" }], []);

    expect(sitemap).not.toContain("<lastmod>");
  });
});
