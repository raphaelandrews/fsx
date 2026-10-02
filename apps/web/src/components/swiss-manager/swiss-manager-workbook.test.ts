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
        birthDate: null,
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
});
