import { describe, expect, test } from "bun:test";

import { personJsonLd, stripMarkdown, truncate } from "./seo";

describe("meta descriptions", () => {
  test("strip Markdown syntax before truncating", () => {
    const markdown = "## Torneio **Aberto**\n\n> Inscrições [aqui](https://x.org) até *sexta*.\n\n![Cartaz](/a.png)\n\n- Rodada 1\n- Rodada 2";
    expect(truncate(markdown)).toBe("Torneio Aberto Inscrições aqui até sexta. Cartaz Rodada 1 Rodada 2");
    expect(stripMarkdown("| A | B |\n| --- | --- |\n| 1 | 2 |").replace(/\s+/g, " ").trim()).toBe("A B 1 2");
  });

  test("fall back to the default description for empty or syntax-only content", () => {
    expect(truncate("***")).not.toBe("");
    expect(truncate(null)).toBe(truncate(""));
  });
});

describe("structured data", () => {
  test("only describes a player image when the player has one", () => {
    expect(personJsonLd({ name: "Ana", path: "/jogadores/1" }).image).toBeUndefined();
    expect(personJsonLd({ name: "Ana", path: "/jogadores/1", image: "/api/media/players/a.webp" }).image).toBe(
      "https://www.fsx.org.br/api/media/players/a.webp",
    );
  });
});
