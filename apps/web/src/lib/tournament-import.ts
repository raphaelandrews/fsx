import { COMPETITION_CATEGORIES, COMPETITION_TIERS, type CompetitionCategory, type CompetitionTier } from "@fsx/api/circuit-types";
import { RATING_TYPES, type RatingType } from "@fsx/api/rating-types";

import { toIsoDate } from "@/lib/format";
import type { ImportSheet } from "@/lib/rating-import-file";

export const TOURNAMENT_SHEET = "tournament";
export const RESULTS_SHEET = "results";
export const PODIUM_SHEET = "podium";

/** Stands in for the tournament id in the results plan until the tournament exists. */
export const DRAFT_TOURNAMENT_ID = 1;

export interface TournamentDraft {
  name: string;
  date: string | null;
  ratingType: RatingType;
  tier: CompetitionTier;
  championshipId: number | null;
  chessResults: string | null;
}

export interface PodiumDraft {
  /** Row in the Podium sheet. */
  sheetRow: number;
  place: number;
  category: CompetitionCategory | null;
  /** An existing player, or `resultRow`: the Results row of a player the import creates. */
  playerId?: number;
  resultRow?: number;
  error?: string;
}

const isBlank = (cell: unknown) => cell === null || cell === undefined || String(cell).trim() === "";
const cellText = (cell: unknown) => String(cell ?? "").trim();
const isOneOf = <T extends string>(options: readonly T[], value: string): value is T => (options as readonly string[]).includes(value);

/** The Tournament sheet is two columns: field, value. */
export function parseTournamentMeta(rows: unknown[][]): { draft: TournamentDraft } | { error: string } {
  const fields = new Map<string, string>();
  for (const [key, value] of rows) {
    const name = cellText(key).toLowerCase();
    if (name) fields.set(name, cellText(value));
  }

  const name = fields.get("name");
  if (!name) return { error: "The Tournament sheet needs a 'name' row." };
  const ratingType = fields.get("ratingtype")?.toLowerCase() ?? "";
  if (!isOneOf(RATING_TYPES, ratingType)) return { error: "The Tournament sheet needs 'ratingType': classic, rapid or blitz." };
  const tier = fields.get("tier") || "B";
  if (!isOneOf(COMPETITION_TIERS, tier)) return { error: `Unknown tier '${tier}'. Use ${COMPETITION_TIERS.join(", ")}.` };

  const rawDate = fields.get("date");
  const date = rawDate ? toIsoDate(rawDate) : null;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: `Invalid date '${rawDate}'. Use DD/MM/YYYY or YYYY-MM-DD.` };

  const rawChampionship = fields.get("championshipid");
  const championshipId = rawChampionship ? Number(rawChampionship) : null;
  if (championshipId !== null && (!Number.isInteger(championshipId) || championshipId <= 0)) {
    return { error: `Invalid championshipId '${rawChampionship}'.` };
  }
  const chessResults = fields.get("chessresults") || null;
  if (chessResults && !/^https?:\/\//i.test(chessResults)) return { error: "chessResults must be a link starting with http:// or https://." };

  return { draft: { name, date, ratingType, tier, championshipId, chessResults } };
}

/** The Podium sheet has a header row: place, category (optional), and playerId or row. */
export function parsePodium(rows: unknown[][]): PodiumDraft[] {
  const [header = [], ...body] = rows;
  const columns = new Map(header.map((cell, index) => [cellText(cell).toLowerCase(), index]));
  const read = (cells: unknown[], column: string) => (columns.has(column) ? cells[columns.get(column)!] : undefined);

  return body
    .map((cells, index) => ({ cells, sheetRow: index + 2 }))
    .filter(({ cells }) => cells.some((cell) => !isBlank(cell)))
    .map(({ cells, sheetRow }): PodiumDraft => {
      const place = Number(read(cells, "place"));
      const category = cellText(read(cells, "category"));
      const playerId = isBlank(read(cells, "playerid")) ? undefined : Number(read(cells, "playerid"));
      const resultRow = isBlank(read(cells, "row")) ? undefined : Number(read(cells, "row"));
      const base = { sheetRow, place, category: null, playerId, resultRow };
      if (!Number.isInteger(place) || place < 1) return { ...base, error: "Invalid place. Use 1, 2, 3…" };
      if (category && !isOneOf(COMPETITION_CATEGORIES, category)) return { ...base, error: `Unknown category '${category}'.` };
      if ((playerId === undefined) === (resultRow === undefined)) return { ...base, error: "Fill either playerId or row (a row of the Results sheet), not both." };
      if (playerId !== undefined && (!Number.isInteger(playerId) || playerId <= 0)) return { ...base, error: "Invalid playerId." };
      if (resultRow !== undefined && (!Number.isInteger(resultRow) || resultRow < 2)) return { ...base, error: "Invalid row." };
      return { ...base, category: (category || null) as CompetitionCategory | null };
    });
}

/** Results rows plus the two columns the rating import expects, so the same planning and review apply. */
export function withTournamentColumns(sheet: ImportSheet, ratingType: RatingType): ImportSheet {
  const width = Math.max(...Object.values(sheet.headerMap)) + 1;
  return {
    headerMap: { ...sheet.headerMap, tournamentid: width, ratingtype: width + 1 },
    rows: sheet.rows.map(({ cells, sheetRow }) => {
      const extended = [...cells];
      extended[width] = DRAFT_TOURNAMENT_ID;
      extended[width + 1] = ratingType;
      return { cells: extended, sheetRow };
    }),
  };
}

export const TOURNAMENT_TEMPLATE = {
  tournament: [
    ["name", "Open de Aracaju 2026"],
    ["date", "15/11/2026"],
    ["ratingType", "rapid"],
    ["tier", "B"],
    ["championshipId", ""],
    ["chessResults", ""],
  ],
  results: [
    ["id", "name", "birth", "sex", "clubId", "locationId", "variation"],
    [1234, "", "", "", "", "", 12],
    [0, "New Player", 2012, "M", 3, 5, -4],
  ],
  podium: [
    ["place", "category", "playerId", "row"],
    [1, "", 1234, ""],
    [2, "", "", 3],
  ],
} as const;
