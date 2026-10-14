import { normalizeName } from "@fsx/db/normalize";

export const SEARCH_RESULT_LIMIT = 10;

// SQLite's lower() and LIKE only fold ASCII, so "São" never matches "sao" in SQL.
// Small lookup tables are scanned either way; matching the normalized names in
// the Worker makes the search accent-insensitive at the same rows read.
export const SEARCH_SCAN_LIMIT = 5_000;

export function searchWords(query: string): string[] {
  return normalizeName(query).split(/\s+/).filter(Boolean);
}

export function matchesAllWords(name: string, words: readonly string[]): boolean {
  const normalized = normalizeName(name);
  return words.every((word) => normalized.includes(word));
}
