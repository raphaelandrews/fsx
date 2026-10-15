import { describe, expect, test } from "bun:test";

import { byTitleTier } from "./title-emblems";

describe("byTitleTier", () => {
  test("orders title emblems from the highest tier, keeping ties in order", () => {
    const links = [
      { title: { name: "Mestre Mirim Sergipano", tier: 1 } },
      { title: { name: "Mestre Nacional", tier: 4 } },
      { title: { name: "Candidato a Mestre Sergipano", tier: 2 } },
      { title: { name: "Mestre Júnior Sergipano", tier: 1 } },
    ];
    expect(byTitleTier(links).map((link) => link.title.name)).toEqual([
      "Mestre Nacional",
      "Candidato a Mestre Sergipano",
      "Mestre Mirim Sergipano",
      "Mestre Júnior Sergipano",
    ]);
  });
});
