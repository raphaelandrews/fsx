import { describe, expect, test } from "bun:test";

import { planImport } from "./rating-import";
import { DRAFT_TOURNAMENT_ID, parsePodium, parseTournamentMeta, withTournamentColumns } from "./tournament-import";

describe("parseTournamentMeta", () => {
  test("reads the field/value rows, case-insensitively, with defaults", () => {
    expect(parseTournamentMeta([["Name", " Open "], ["RatingType", "Rapid"], ["date", "15/11/2026"], ["championshipId", "3"]])).toEqual({
      draft: { name: "Open", date: "2026-11-15", ratingType: "rapid", tier: "B", championshipId: 3, chessResults: null },
    });
  });

  test("says what is wrong", () => {
    expect(parseTournamentMeta([["ratingType", "rapid"]])).toEqual({ error: "The Tournament sheet needs a 'name' row." });
    expect(parseTournamentMeta([["name", "X"], ["ratingType", "bullet"]])).toMatchObject({ error: expect.stringContaining("ratingType") });
    expect(parseTournamentMeta([["name", "X"], ["ratingType", "rapid"], ["tier", "Z"]])).toMatchObject({ error: expect.stringContaining("tier") });
    expect(parseTournamentMeta([["name", "X"], ["ratingType", "rapid"], ["date", "ontem"]])).toMatchObject({ error: expect.stringContaining("date") });
    expect(parseTournamentMeta([["name", "X"], ["ratingType", "rapid"], ["chessResults", "ftp://x"]])).toMatchObject({ error: expect.stringContaining("http") });
  });
});

describe("parsePodium", () => {
  test("accepts a player id or a Results row, and flags the rest", () => {
    const rows = parsePodium([
      ["place", "category", "playerId", "row"],
      [1, "", 10, ""],
      [2, "Sub 12 Masculino", "", 3],
      [3, "", 10, 3],
      ["x", "", 10, ""],
      [1, "Inventada", 10, ""],
      [],
    ], ["Sub 12 Masculino"]);
    expect(rows.map((row) => [row.sheetRow, row.error === undefined])).toEqual([[2, true], [3, true], [4, false], [5, false], [6, false]]);
    expect(rows[1]).toMatchObject({ place: 2, category: "Sub 12 Masculino", resultRow: 3 });
  });
});

describe("withTournamentColumns", () => {
  test("lets the normal rating plan validate the results", () => {
    const sheet = withTournamentColumns(
      {
        headerMap: { id: 0, name: 1, variation: 2 },
        rows: [
          { cells: [5, "", 12], sheetRow: 2 },
          { cells: [0, "Nova", -4], sheetRow: 3 },
          { cells: [6, "", 500], sheetRow: 4 },
        ],
      },
      "blitz",
    );
    const plan = planImport(sheet.rows, sheet.headerMap);
    expect(plan.map((entry) => entry.action)).toEqual(["rate", "create-and-rate", null]);
    expect(plan[0]!.row.tournament).toEqual({ tournamentId: DRAFT_TOURNAMENT_ID, variation: 12, ratingType: "blitz" });
    expect(plan[2]!.issue).toContain("variation");
  });
});
