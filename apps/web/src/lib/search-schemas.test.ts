import { describe, expect, test } from "bun:test";

import {
  circuitsSearchSchema,
  clubsSearchSchema,
  pageSearchSchema,
  ratingsSearchSchema,
  tournamentsSearchSchema,
  tvSergipeSearchSchema,
} from "./search-schemas";

describe("public search params", () => {
  test("defaults apply when the URL has no params", () => {
    expect(pageSearchSchema.parse({})).toEqual({ page: 1 });
    expect(clubsSearchSchema.parse({})).toEqual({ ritmo: "rapid", page: 1 });
    expect(ratingsSearchSchema.parse({})).toEqual({
      page: 1,
      ordenar: "rapid",
      local: [],
      clube: [],
      titulo: [],
      grupo: [],
    });
    expect(tvSergipeSearchSchema.parse({})).toEqual({ view: "medals" });
  });

  test("malformed values fall back instead of failing the route", () => {
    for (const page of ["abc", 0, -3, 1.5, 1_001, null, {}]) {
      expect(pageSearchSchema.parse({ page })).toEqual({ page: 1 });
    }
    expect(clubsSearchSchema.parse({ ritmo: "bullet", page: "x" })).toEqual({ ritmo: "rapid", page: 1 });
    expect(tvSergipeSearchSchema.parse({ view: 7, idade: "sub-99", escopo: "x", escola: "nope" })).toEqual({
      view: "medals",
    });
    expect(circuitsSearchSchema.parse({ ano: "2025", circuito: 4 })).toEqual({});
  });

  test("ratings keeps valid values and drops invalid ones", () => {
    const parsed = ratingsSearchSchema.parse({
      page: 3,
      ordenar: "blitz",
      sexo: "female",
      nome: "  ana  ",
      local: ["Aracaju"],
      clube: "not-an-array",
      grupo: ["sub-10", "nonsense"],
    });
    expect(parsed).toMatchObject({
      page: 3,
      ordenar: "blitz",
      sexo: "female",
      nome: "ana",
      local: ["Aracaju"],
      clube: [],
    });
    expect(parsed.grupo).toEqual(["sub-10"]);
    expect(ratingsSearchSchema.parse({ sexo: "x", nome: "a".repeat(500) })).toMatchObject({ page: 1 });
  });

  test("list params are bounded", () => {
    const parsed = ratingsSearchSchema.parse({ local: Array.from({ length: 51 }, () => "x") });
    expect(parsed.local).toEqual([]);
  });
});

describe("tournament archive search params", () => {
  test("default to the first page with no filters", () => {
    expect(tournamentsSearchSchema.parse({})).toEqual({ page: 1 });
  });

  test("keep valid filters and drop malformed ones instead of failing the route", () => {
    expect(tournamentsSearchSchema.parse({ page: 2, ano: 2026, nivel: "S", ritmo: "blitz", campeonato: 4 })).toEqual({
      page: 2,
      ano: 2026,
      nivel: "S",
      ritmo: "blitz",
      campeonato: 4,
    });
    expect(tournamentsSearchSchema.parse({ page: "x", ano: "abc", nivel: "Z", ritmo: "bullet", campeonato: -1 })).toEqual({ page: 1 });
    expect(tournamentsSearchSchema.parse({ ano: 3000, campeonato: 1.5 })).toEqual({ page: 1 });
  });
});
