import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";

import { buildSwissManagerWorkbook, type SwissManagerPlayer } from "./swiss-manager-workbook";

describe("Swiss Manager workbook", () => {
  test("keeps user-controlled values as literal strings, never formulas", async () => {
    const players = [
      {
        id: 1,
        name: "=HYPERLINK(\"https://example.invalid\")",
        sex: "male",
        birthYear: null,
        classic: 1800,
        rapid: 1900,
        blitz: 1700,
        club: null,
      },
    ] as SwissManagerPlayer[];

    const workbookBlob = await buildSwissManagerWorkbook(players, "rapid");
    const workbook = XLSX.read(await workbookBlob.arrayBuffer(), { type: "array" });
    const nameCell = workbook.Sheets.Players?.B2;

    expect(nameCell?.t).toBe("s");
    expect(nameCell?.f).toBeUndefined();
    expect(nameCell?.v).toBe(players[0]?.name);
  });

  test("exports only the birth year, with month and day as 00, whatever the machine time zone", async () => {
    const players = [
      { id: 1, name: "A", sex: "male", birthYear: 2010, classic: 1, rapid: 1, blitz: 1, club: null },
    ] as SwissManagerPlayer[];
    const previous = process.env.TZ;
    process.env.TZ = "America/Sao_Paulo";
    try {
      const blob = await buildSwissManagerWorkbook(players, "rapid");
      const rows = XLSX.utils.sheet_to_json<{ Birthday: string }>(
        XLSX.read(await blob.arrayBuffer(), { type: "array" }).Sheets.Players!,
      );
      expect(rows[0]?.Birthday).toBe("2010-00-00");
    } finally {
      process.env.TZ = previous;
    }
  });
});
