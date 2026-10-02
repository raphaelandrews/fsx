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
