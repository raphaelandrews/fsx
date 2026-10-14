import { toIsoDate } from "@/lib/format";

export type ImportRatingType = "blitz" | "rapid" | "classic";

const RATING_TYPES: readonly string[] = ["blitz", "rapid", "classic"];
const TOURNAMENT_COLUMNS = ["tournamentid", "variation", "ratingtype"];
const PLAYER_COLUMNS = ["name", "sex", "birth", "locationid", "clubid"];

export const MAX_VARIATION = 100;

export function columnsError(headerMap: Record<string, number>): string | null {
  const available = Object.keys(headerMap);
  const hasPlayerData = PLAYER_COLUMNS.some((column) => column in headerMap);
  const hasAllTournament = TOURNAMENT_COLUMNS.every((column) => column in headerMap);
  const hasPartialTournament = TOURNAMENT_COLUMNS.some((column) => column in headerMap);

  if (available.length === 1 && available[0] === "id") {
    return "File contains only the 'id' column. Additional data columns are required.";
  }
  if (hasPartialTournament && !hasAllTournament) {
    return "If any tournament-related column is present, all three (tournamentId, variation, ratingType) must be included.";
  }
  if (!hasPlayerData && !hasAllTournament) {
    return "File must contain either player data columns or complete tournament columns.";
  }
  return null;
}

export interface ImportRow {
  id: number;
  name?: string;
  birth?: string;
  sex?: "male" | "female";
  clubId?: number;
  locationId?: number;
  tournament?: { tournamentId: number; variation: number; ratingType: ImportRatingType };
  error?: string;
}

export function parseImportRow(cells: unknown[], headerMap: Record<string, number>): ImportRow {
  const text = (column: string) =>
    headerMap[column] === undefined ? undefined : String(cells[headerMap[column]!] ?? "").trim();
  const integer = (raw: string | undefined) => (raw ? Number.parseInt(raw, 10) : undefined);

  const id = Number.parseInt(String(cells[headerMap["id"]!]), 10);
  const name = text("name");
  const birthRaw = text("birth");
  const sexRaw = text("sex")?.toLowerCase();
  const clubId = integer(text("clubid"));
  const locationId = integer(text("locationid"));
  const tournamentIdRaw = text("tournamentid");
  const variationRaw = text("variation");
  const ratingTypeRaw = text("ratingtype")?.toLowerCase();
  const tournamentId = integer(tournamentIdRaw);
  const variation = integer(variationRaw);

  const sex =
    sexRaw === "true" || sexRaw === "1" || sexRaw === "t"
      ? "male"
      : sexRaw === "false" || sexRaw === "0" || sexRaw === "f"
        ? "female"
        : undefined;
  const row: ImportRow = {
    id,
    name,
    birth: birthRaw === undefined ? undefined : toIsoDate(birthRaw),
    sex,
    clubId,
    locationId,
  };

  const isTournamentUpdate =
    tournamentId !== undefined || variation !== undefined || ratingTypeRaw !== undefined;
  if (isTournamentUpdate) {
    if (tournamentId === undefined || variation === undefined || !ratingTypeRaw || !RATING_TYPES.includes(ratingTypeRaw)) {
      return {
        ...row,
        error: "If any tournament-related column is present, all three (tournamentId, variation, ratingType) must be valid.",
      };
    }
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return { ...row, error: `Invalid tournament ID '${tournamentIdRaw}'. Must be a positive integer.` };
    }
    if (!Number.isInteger(variation) || variation < -MAX_VARIATION || variation > MAX_VARIATION) {
      return {
        ...row,
        error: `Invalid variation value '${variationRaw}'. Must be an integer between -${MAX_VARIATION} and ${MAX_VARIATION}.`,
      };
    }
    row.tournament = { tournamentId, variation, ratingType: ratingTypeRaw as ImportRatingType };
  }
  if (Number.isNaN(id) || id < 0) {
    return { ...row, error: "Invalid or missing 'id'. ID must be 0 or positive." };
  }
  if (id === 0 && !name) {
    return { ...row, error: "Missing or empty 'name' for new player." };
  }
  return row;
}
