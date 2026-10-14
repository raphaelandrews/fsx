export function padNumber(value: number, width = 3): string {
  return String(value).padStart(width, "0")
}

// Spreadsheets in Brazil usually type dates as DD/MM/YYYY; the API stores
// YYYY-MM-DD. Unrecognized values pass through so the API rejects them per row.
export function toIsoDate(value: string): string {
  const trimmed = value.trim()
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (!match) return trimmed
  const [, day, month, year] = match
  return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`
}

// D1 stores CURRENT_TIMESTAMP as "YYYY-MM-DD HH:MM:SS" in UTC with no zone, which
// browsers would read as local time.
export function parseDbTimestamp(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(" ", "T")}Z`);
}

export function toIsoTimestamp(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = parseDbTimestamp(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
