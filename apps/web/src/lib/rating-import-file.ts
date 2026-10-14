import { columnsError } from "./rating-import";

export const MAX_IMPORT_ROWS = 2_000;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export const IMPORT_COLUMNS = [
  { name: "id", required: true, help: "Player ID. Use 0 to create a new player (then name is required)." },
  { name: "name", help: "Full name. Required for a new player; otherwise renames the player." },
  { name: "birth", help: "Birth date as DD/MM/YYYY or YYYY-MM-DD." },
  { name: "sex", help: "M/T/1 for male, F/0 for female." },
  { name: "clubId", help: "ID of the player's club." },
  { name: "locationId", help: "ID of the player's location." },
  { name: "tournamentId", help: "ID of the tournament. Fill tournamentId, variation and ratingType together." },
  { name: "variation", help: "Rating points won or lost, from -100 to 100." },
  { name: "ratingType", help: "classic, rapid or blitz; must match the tournament." },
] as const;

export interface ImportSheet {
  headerMap: Record<string, number>;
  rows: { cells: unknown[]; sheetRow: number }[];
}

const isBlank = (cell: unknown) => cell === null || cell === undefined || cell === "";

/** Reads the first sheet of an Excel file. Throws an Error whose message says what to fix. */
export async function readImportSheet(file: File): Promise<ImportSheet> {
  if (!/\.xlsx?$/i.test(file.name)) throw new Error("Only Excel files (.xlsx, .xls) are accepted.");
  if (file.size > MAX_IMPORT_BYTES) throw new Error("The file is larger than 5 MB. Split it into smaller files.");

  const [XLSX, buffer] = await Promise.all([import("xlsx"), file.arrayBuffer()]);
  let sheetRows: unknown[][];
  try {
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    if (!worksheet) throw new Error("empty");
    sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" }) as unknown[][];
  } catch {
    throw new Error("This file could not be read. Check that it is a valid Excel file.");
  }

  const header = sheetRows[0];
  if (!header || header.every(isBlank)) throw new Error("The first row must contain the column names.");

  const headerMap: Record<string, number> = {};
  header.forEach((cell, index) => {
    const name = String(cell ?? "").toLowerCase().trim();
    if (name) headerMap[name] = index;
  });
  if (headerMap["id"] === undefined) throw new Error("The mandatory column 'id' is missing.");
  const problem = columnsError(headerMap);
  if (problem) throw new Error(problem);

  const rows = sheetRows
    .map((cells, index) => ({ cells, sheetRow: index + 1 }))
    .slice(1)
    .filter(({ cells }) => cells.some((cell) => !isBlank(cell)));
  if (rows.length === 0) throw new Error("The file has no data rows.");
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`The file has ${rows.length} rows; at most ${MAX_IMPORT_ROWS} can be imported at once. Split it.`);
  }
  return { headerMap, rows };
}

/** A starter file with every column and two example rows. */
export async function downloadImportTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    IMPORT_COLUMNS.map((column) => column.name),
    [1234, "", "", "", "", "", 101, 12, "rapid"],
    [0, "New Player", "15/03/2012", "M", 3, 5, 101, -4, "rapid"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Rating update");
  XLSX.writeFile(workbook, "rating-update-template.xlsx");
}
