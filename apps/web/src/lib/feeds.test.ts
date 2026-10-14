import { describe, expect, test } from "bun:test";

import type { FeedRow } from "@fsx/api/http/feeds";

import { renderRss } from "./feeds";

const row = (overrides: Partial<FeedRow>): FeedRow => ({
  kind: "post",
  id: 1,
  title: "Título",
  path: "/noticias/titulo",
  teaser: "Resumo da notícia.",
  createdAt: "2026-10-01 12:00:00",
  ...overrides,
});

describe("renderRss", () => {
  test("lists the newest entry first with absolute links and UTC dates", () => {
    const xml = renderRss([
      row({ title: "Antiga", path: "/noticias/antiga", createdAt: "2026-09-01 08:00:00" }),
      row({ kind: "announcement", title: "Comunicado 001/2026", path: "/comunicados/3", createdAt: "2026-10-02 09:30:00" }),
    ]);
    expect(xml.indexOf("Comunicado 001/2026")).toBeLessThan(xml.indexOf("Antiga"));
    expect(xml).toContain("<link>https://www.fsx.org.br/comunicados/3</link>");
    expect(xml).toContain("<pubDate>Fri, 02 Oct 2026 09:30:00 GMT</pubDate>");
    expect(xml).toContain("<category>Comunicados</category>");
    expect(xml).toContain('<atom:link href="https://www.fsx.org.br/rss.xml" rel="self"');
  });

  test("escapes markup in titles and strips Markdown from descriptions", () => {
    const xml = renderRss([row({ title: 'Xadrez & "cultura" <b>', teaser: "## Destaque\n\nLeia **mais** [aqui](https://x.org)." })]);
    expect(xml).toContain("<title>Xadrez &amp; &quot;cultura&quot; &lt;b&gt;</title>");
    expect(xml).toContain("<description>Destaque Leia mais aqui.</description>");
  });

  test("is a valid empty feed without entries", () => {
    const xml = renderRss([]);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
