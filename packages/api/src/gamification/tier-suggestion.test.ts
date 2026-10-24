import { describe, expect, test } from "bun:test";

import { calibrateStrengthLines, suggestTier, type CalibrationSample } from "./tier-suggestion";

const field = (size: number, rating: number) => Array.from({ length: size }, () => rating);

describe("suggestTier", () => {
  test("a strong, full rapid field is Tier A", () => {
    const result = suggestTier({ tier: "B", ratingType: "rapid", ratings: field(24, 2300) });
    expect(result).toMatchObject({ suggested: "A", players: 24, strength: 2300 });
  });

  test("only the strongest ten count toward strength", () => {
    const ratings = [...field(10, 2260), ...field(30, 1900)];
    expect(suggestTier({ tier: "B", ratingType: "rapid", ratings })).toMatchObject({ suggested: "A", strength: 2260 });
  });

  test("a weaker or smaller field stays Tier B", () => {
    expect(suggestTier({ tier: "A", ratingType: "rapid", ratings: field(40, 2249) }).suggested).toBe("B");
    expect(suggestTier({ tier: "B", ratingType: "rapid", ratings: field(19, 2400) }).suggested).toBe("B");
  });

  test("the strength line depends on the rhythm", () => {
    expect(suggestTier({ tier: "B", ratingType: "blitz", ratings: field(25, 2050) }).suggested).toBe("A");
    expect(suggestTier({ tier: "B", ratingType: "rapid", ratings: field(25, 2050) }).suggested).toBe("B");
    expect(suggestTier({ tier: "B", ratingType: "classic", ratings: field(25, 2000) }).suggested).toBe("B");
  });

  test("size never suggests a school event", () => {
    expect(suggestTier({ tier: "B", ratingType: "rapid", ratings: field(120, 1900) }).suggested).toBe("B");
  });

  test("an event already marked school gets no suggestion", () => {
    expect(suggestTier({ tier: "school", ratingType: "rapid", ratings: field(30, 2300) }).suggested).toBeNull();
  });

  test("Tier S and empty events get no suggestion", () => {
    expect(suggestTier({ tier: "S", ratingType: "rapid", ratings: field(30, 2400) }).suggested).toBeNull();
    expect(suggestTier({ tier: "B", ratingType: "rapid", ratings: [] })).toMatchObject({ suggested: null, strength: null });
  });
});

describe("calibrateStrengthLines", () => {
  const fallback = { rapid: 2250, blitz: 2040, classic: 2010 };
  const sample = (over: Partial<CalibrationSample>): CalibrationSample => ({
    ratingType: "rapid",
    date: "2026-05-01",
    championship: null,
    ratings: field(24, 2100),
    ...over,
  });
  const pool = (strengths: number[], over: Partial<CalibrationSample> = {}) => strengths.map((s) => sample({ ratings: field(24, s), ...over }));

  test("the line is the 75th percentile of the pool, rounded up to 10", () => {
    // Eight events: nearest rank 6 of 8 is 2200, rounded up to 2200; a 2143 would become 2150.
    const lines = calibrateStrengthLines(pool([2000, 2050, 2100, 2150, 2180, 2200, 2300, 2400]), "2026-10-24", fallback);
    expect(lines.rapid).toBe(2200);
    expect(calibrateStrengthLines(pool([2000, 2050, 2100, 2110, 2120, 2143, 2300, 2400]), "2026-10-24", fallback).rapid).toBe(2150);
  });

  test("Sergipanos count as ordinary members of the pool", () => {
    const lines = calibrateStrengthLines([...pool([2000, 2050, 2100, 2150, 2180, 2200, 2300]), sample({ championship: "Rápido", ratings: field(30, 2400) })], "2026-10-24", fallback);
    expect(lines.rapid).toBe(2200);
  });

  test("keeps the previous line with too few events, and ignores restricted, small and old ones", () => {
    const ignored = [
      ...pool([1500, 1500, 1500], { championship: "Feminino" }),
      sample({ ratings: field(8, 1500) }),
      sample({ date: "2022-01-01", ratings: field(24, 1500) }),
    ];
    const lines = calibrateStrengthLines([...pool([2300, 2300, 2300, 2300, 2300, 2300, 2300], { ratingType: "blitz" }), ...ignored], "2026-10-24", fallback);
    expect(lines).toEqual(fallback);
  });
});
