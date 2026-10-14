import { describe, expect, test } from "bun:test";

import { columnsError, parseImportRow, planImport, summarizePlan } from "./rating-import";
import { csvCell, failuresToCsv } from "./rating-import-report";

const headers = (...names: string[]) => Object.fromEntries(names.map((name, index) => [name, index]));

describe("columnsError", () => {
  test("accepts player columns or the full tournament set", () => {
    expect(columnsError(headers("id", "name"))).toBeNull();
    expect(columnsError(headers("id", "tournamentid", "variation", "ratingtype"))).toBeNull();
  });

  test("rejects id-only, partial tournament and unrelated files", () => {
    expect(columnsError(headers("id"))).toContain("only the 'id' column");
    expect(columnsError(headers("id", "name", "variation"))).toContain("all three");
    expect(columnsError(headers("id", "notes"))).toContain("player data columns");
  });
});

describe("parseImportRow", () => {
  const tournamentHeaders = headers("id", "name", "tournamentid", "variation", "ratingtype");

  test("parses a player update", () => {
    const row = parseImportRow(["12", " Ana ", "", "", ""], headers("id", "name", "birth", "sex", "clubid"));
    expect(row).toMatchObject({ id: 12, name: "Ana", birth: "", sex: undefined, clubId: undefined });
    expect(row.error).toBeUndefined();
  });

  test("converts Brazilian dates and the boolean sex flag", () => {
    const row = parseImportRow(["1", "05/03/2010", "F", "7"], headers("id", "birth", "sex", "clubid"));
    expect(row).toMatchObject({ birth: "2010-03-05", sex: "female", clubId: 7 });
    expect(parseImportRow(["1", "T"], headers("id", "sex")).sex).toBe("male");
  });

  test("parses a complete tournament result", () => {
    const row = parseImportRow(["5", "Ana", "30", "-12", "Rapid"], tournamentHeaders);
    expect(row.error).toBeUndefined();
    expect(row.tournament).toEqual({ tournamentId: 30, variation: -12, ratingType: "rapid" });
  });

  test("flags invalid tournament data before the id", () => {
    expect(parseImportRow(["5", "Ana", "30", "", "rapid"], tournamentHeaders).error).toContain("all three");
    expect(parseImportRow(["5", "Ana", "30", "1", "bullet"], tournamentHeaders).error).toContain("all three");
    expect(parseImportRow(["5", "Ana", "abc", "1", "rapid"], tournamentHeaders).error).toContain("Invalid tournament ID 'abc'");
    expect(parseImportRow(["5", "Ana", "0", "1", "rapid"], tournamentHeaders).error).toContain("positive integer");
    expect(parseImportRow(["5", "Ana", "30", "101", "rapid"], tournamentHeaders).error).toContain("between -100 and 100");
    expect(parseImportRow(["5", "Ana", "30", "-101", "rapid"], tournamentHeaders).error).toContain("between -100 and 100");
    expect(parseImportRow(["x", "Ana", "30", "1", "rapid"], tournamentHeaders).error).toContain("Invalid or missing 'id'");
  });

  test("validates the id and new-player name", () => {
    expect(parseImportRow(["abc", "Ana"], headers("id", "name")).error).toContain("Invalid or missing 'id'");
    expect(parseImportRow(["-3", "Ana"], headers("id", "name")).error).toContain("Invalid or missing 'id'");
    expect(parseImportRow(["0", ""], headers("id", "name")).error).toContain("Missing or empty 'name'");
    expect(parseImportRow(["0", "Nova"], headers("id", "name")).error).toBeUndefined();
  });
});

describe("planImport", () => {
  const map = headers("id", "name", "tournamentid", "variation", "ratingtype");
  const rows = (...cells: string[][]) => cells.map((row, index) => ({ cells: row, sheetRow: index + 2 }));

  test("decides each row's action before anything is written", () => {
    const plan = planImport(
      rows(["5", "Ana", "30", "10", "rapid"], ["0", "Nova", "30", "-4", "rapid"], ["7", "", "", "", ""], ["x", "Bad", "", "", ""]),
      map,
    );
    expect(plan.map((entry) => entry.action)).toEqual(["rate", "create-and-rate", null, null]);
    expect(plan[2]!.issue).toContain("Nothing to change");
    expect(plan[3]!.issue).toContain("Invalid or missing 'id'");
    expect(plan[0]!.input).toBe("id=5, name=Ana, tournamentid=30, variation=10, ratingtype=rapid");
  });

  test("flags the same player and tournament appearing twice", () => {
    const plan = planImport(rows(["5", "Ana", "30", "10", "rapid"], ["5", "Ana", "30", "3", "rapid"]), map);
    expect(plan[0]!.action).toBe("rate");
    expect(plan[1]!.action).toBeNull();
    expect(plan[1]!.issue).toBe("Duplicate of row 2: the same player and tournament appear twice.");
  });

  test("plans profile-only rows when there is no tournament result", () => {
    const profileMap = headers("id", "name", "birth");
    const plan = planImport(rows(["9", "Beto", "01/02/2011"], ["0", "Carla", ""]), profileMap);
    expect(plan.map((entry) => entry.action)).toEqual(["update", "create"]);
  });

  test("summarizes what the import would change", () => {
    const plan = planImport(
      rows(["5", "Ana", "30", "10", "rapid"], ["0", "Nova", "31", "-4", "blitz"], ["6", "", "", "", ""]),
      map,
    );
    expect(summarizePlan(plan)).toEqual({
      total: 3,
      runnable: 2,
      problems: 1,
      ratingResults: 2,
      newPlayers: 1,
      profileUpdates: 0,
      tournamentIds: [30, 31],
      ratingTypes: ["rapid", "blitz"],
    });
  });
});

describe("failure report", () => {
  test("escapes CSV and neutralizes spreadsheet formulas", () => {
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell(undefined)).toBe("");
  });

  test("lists only the rows that did not apply, in sheet order", () => {
    const csv = failuresToCsv([
      { sheetRow: 9, status: "failed", title: "Zé", summary: "Player not found" },
      { sheetRow: 3, status: "applied", title: "Ana", summary: "Rapid +10" },
      { sheetRow: 4, status: "skipped", title: "Beto", summary: "Not run", input: "id=4" },
    ]);
    expect(csv.split("\r\n")).toEqual([
      "row,status,player,problem,detail,input",
      "4,skipped,Beto,Not run,,id=4",
      "9,failed,Zé,Player not found,,",
    ]);
  });
});
