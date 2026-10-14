import { RATING_TYPES, type RatingType } from "@fsx/api/rating-types";

import { toIsoDate } from "@/lib/format";

const TOURNAMENT_COLUMNS = ["tournamentid", "variation", "ratingtype"];
const PLAYER_COLUMNS = ["name", "sex", "birth", "locationid", "clubid"];

const isRatingType = (value: string): value is RatingType => (RATING_TYPES as readonly string[]).includes(value);

const MAX_VARIATION = 100;

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
  tournament?: { tournamentId: number; variation: number; ratingType: RatingType };
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

  const isTournamentUpdate = Boolean(tournamentIdRaw || variationRaw || ratingTypeRaw);
  if (isTournamentUpdate) {
    if (tournamentId === undefined || variation === undefined || !ratingTypeRaw || !isRatingType(ratingTypeRaw)) {
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
    row.tournament = { tournamentId, variation, ratingType: ratingTypeRaw };
  }
  if (Number.isNaN(id) || id < 0) {
    return { ...row, error: "Invalid or missing 'id'. ID must be 0 or positive." };
  }
  if (id === 0 && !name) {
    return { ...row, error: "Missing or empty 'name' for new player." };
  }
  return row;
}

export type ImportAction = "rate" | "create-and-rate" | "update" | "create";

export interface PlanRow {
  sheetRow: number;
  row: ImportRow;
  /** What the import will do; null when the row cannot be applied. */
  action: ImportAction | null;
  /** Why the row is skipped. */
  issue?: string;
  /** The row as typed in the sheet, for error reports. */
  input: string;
}

const hasProfileData = (row: ImportRow) => Boolean(row.name || row.birth || row.sex || row.clubId || row.locationId);

function actionFor(row: ImportRow): { action: ImportAction } | { issue: string } {
  if (row.tournament) {
    if (row.id > 0) return { action: "rate" };
    if (row.id === 0 && row.name) return { action: "create-and-rate" };
  } else {
    if (row.id > 0 && hasProfileData(row)) return { action: "update" };
    if (row.id === 0 && row.name) return { action: "create" };
    if (row.id > 0) return { issue: "Nothing to change: the row has an id but no player data and no tournament result." };
  }
  return { issue: "Invalid data: no valid operation." };
}

/** Everything the import would do, decided before any write so it can be reviewed. */
export function planImport(
  rows: { cells: unknown[]; sheetRow: number }[],
  headerMap: Record<string, number>,
): PlanRow[] {
  const seenResults = new Map<string, number>();
  return rows.map(({ cells, sheetRow }) => {
    const row = parseImportRow(cells, headerMap);
    const input = Object.entries(headerMap)
      .map(([column, index]) => `${column}=${String(cells[index] ?? "")}`)
      .join(", ");
    if (row.error) return { sheetRow, row, action: null, issue: row.error, input };

    const decided = actionFor(row);
    if ("issue" in decided) return { sheetRow, row, action: null, issue: decided.issue, input };

    if (row.tournament && row.id > 0) {
      const key = `${row.id}:${row.tournament.tournamentId}`;
      const first = seenResults.get(key);
      if (first !== undefined) {
        return { sheetRow, row, action: null, issue: `Duplicate of row ${first}: the same player and tournament appear twice.`, input };
      }
      seenResults.set(key, sheetRow);
    }
    return { sheetRow, row, action: decided.action, input };
  });
}

export interface PlanSummary {
  total: number;
  runnable: number;
  problems: number;
  ratingResults: number;
  newPlayers: number;
  profileUpdates: number;
  tournamentIds: number[];
  ratingTypes: RatingType[];
}

export function summarizePlan(plan: PlanRow[]): PlanSummary {
  const runnable = plan.filter((entry) => entry.action !== null);
  const results = runnable.filter((entry) => entry.row.tournament);
  return {
    total: plan.length,
    runnable: runnable.length,
    problems: plan.length - runnable.length,
    ratingResults: results.length,
    newPlayers: runnable.filter((entry) => entry.action === "create" || entry.action === "create-and-rate").length,
    profileUpdates: runnable.filter((entry) => entry.action === "update").length,
    tournamentIds: [...new Set(results.map((entry) => entry.row.tournament!.tournamentId))].sort((a, b) => a - b),
    ratingTypes: [...new Set(results.map((entry) => entry.row.tournament!.ratingType))],
  };
}
