import { describe, expect, test } from "bun:test";

import { columnsError, parseImportRow } from "./rating-import";

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
