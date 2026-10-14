import { columnsError } from "./rating-import";

export const MAX_IMPORT_ROWS = 2_000;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export const IMPORT_COLUMNS = [
  { name: "id", required: true, help: "Player ID. Use 0 to create a new player (then name is required)." },
  { name: "name", help: "Full name. Required for a new player; otherwise renames the player." },
  { name: "birth", help: "Birth year (2012). A full date is accepted, but only the year is kept." },
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

type Workbook = { SheetNames: string[]; Sheets: Record<string, unknown> };

/** Reads an Excel file into its sheets, as arrays of cells. Throws an Error whose message says what to fix. */
export async function readWorkbook(file: File): Promise<{ sheets: Map<string, unknown[][]>; order: string[] }> {
  if (!/\.xlsx?$/i.test(file.name)) throw new Error("Only Excel files (.xlsx, .xls) are accepted.");
  if (file.size > MAX_IMPORT_BYTES) throw new Error("The file is larger than 5 MB. Split it into smaller files.");

  const [XLSX, buffer] = await Promise.all([import("xlsx"), file.arrayBuffer()]);
  try {
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" }) as unknown as Workbook;
    if (workbook.SheetNames.length === 0) throw new Error("empty");
    const sheets = new Map<string, unknown[][]>();
    for (const name of workbook.SheetNames) {
      const worksheet = workbook.Sheets[name] as Parameters<typeof XLSX.utils.sheet_to_json>[0];
      sheets.set(name.trim().toLowerCase(), XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" }) as unknown[][]);
    }
    return { sheets, order: workbook.SheetNames.map((name) => name.trim().toLowerCase()) };
  } catch {
    throw new Error("This file could not be read. Check that it is a valid Excel file.");
  }
}

/** Turns one sheet's cells into the header map and data rows the import plans from. */
export function toImportSheet(sheetRows: unknown[][], options: { checkColumns?: boolean } = {}): ImportSheet {
  const header = sheetRows[0];
  if (!header || header.every(isBlank)) throw new Error("The first row must contain the column names.");

  const headerMap: Record<string, number> = {};
  header.forEach((cell, index) => {
    const name = String(cell ?? "").toLowerCase().trim();
    if (name) headerMap[name] = index;
  });
  if (headerMap["id"] === undefined) throw new Error("The mandatory column 'id' is missing.");
  const problem = options.checkColumns === false ? null : columnsError(headerMap);
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

/** Reads the first sheet of an Excel file. */
export async function readImportSheet(file: File): Promise<ImportSheet> {
  const { sheets, order } = await readWorkbook(file);
  return toImportSheet(sheets.get(order[0]!) ?? []);
}

/** A starter workbook with the three sheets of a tournament file. */
export async function downloadTournamentTemplate(): Promise<void> {
  const [XLSX, { TOURNAMENT_TEMPLATE }] = await Promise.all([import("xlsx"), import("./tournament-import")]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(TOURNAMENT_TEMPLATE.tournament.map((row) => [...row])), "Tournament");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(TOURNAMENT_TEMPLATE.results.map((row) => [...row])), "Results");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(TOURNAMENT_TEMPLATE.podium.map((row) => [...row])), "Podium");
  XLSX.writeFile(workbook, "tournament-import-template.xlsx");
}

/** A starter file with every column and two example rows. */
export async function downloadImportTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    IMPORT_COLUMNS.map((column) => column.name),
    [1234, "", "", "", "", "", 101, 12, "rapid"],
    [0, "New Player", 2012, "M", 3, 5, 101, -4, "rapid"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Rating update");
  XLSX.writeFile(workbook, "rating-update-template.xlsx");
}
