export type ImportResultStatus = "applied" | "failed" | "skipped";

export interface ImportResult {
  sheetRow: number;
  status: ImportResultStatus;
  /** Who or what the row was about, e.g. the player's name. */
  title: string;
  /** What happened, e.g. "Rapid +12 (1850 → 1862)". */
  summary: string;
  detail?: string;
  /** The row as typed in the sheet. */
  input?: string;
}

// A cell that starts with one of these is a formula when opened in a spreadsheet.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | undefined): string {
  const text = String(value ?? "");
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** A spreadsheet-safe report of the rows that did not apply, for fixing the file and importing again. */
export function failuresToCsv(results: ImportResult[]): string {
  const header = ["row", "status", "player", "problem", "detail", "input"];
  const lines = results
    .filter((result) => result.status !== "applied")
    .sort((a, b) => a.sheetRow - b.sheetRow)
    .map((result) =>
      [result.sheetRow, result.status, result.title, result.summary, result.detail, result.input].map(csvCell).join(","),
    );
  return [header.join(","), ...lines].join("\r\n");
}
