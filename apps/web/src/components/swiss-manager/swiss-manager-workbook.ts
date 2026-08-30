import * as XLSX from "xlsx";

import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";

type SwissManagerPlayer = inferRouterOutputs<AppRouter>["swissManager"]["list"][number];
export type RatingType = "classic" | "rapid" | "blitz";

export const RATING_TYPE_LABELS: Record<RatingType, string> = {
  classic: "Classic",
  rapid: "Rapid",
  blitz: "Blitz",
};

export const RATING_TYPES: RatingType[] = ["classic", "rapid", "blitz"];

interface SwissManagerRow {
  ID_No: number;
  Name: string;
  Sex: string;
  Fed: string;
  ClubNo: number | "";
  ClubName: string;
  Birthday: string;
  Fide_No: number;
  Rtg_Int: number;
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Build a Swiss Manager–compatible .xlsx file from the given players, using the
 * selected rating column for `Rtg_Int`. Returns the resulting Blob.
 */
export function buildSwissManagerWorkbook(
  players: SwissManagerPlayer[],
  ratingType: RatingType,
): Blob {
  const data: SwissManagerRow[] = players.map((player) => ({
    ID_No: player.id,
    Name: player.name,
    Sex: player.sex === "female" ? "f" : "",
    Fed: "BRA",
    ClubNo: player.club?.id ?? "",
    ClubName: player.club?.name ?? "",
    Birthday: formatDate(player.birthDate),
    Fide_No: player.id,
    Rtg_Int: player[ratingType] ?? 0,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 35 },
    { wch: 5 },
    { wch: 5 },
    { wch: 8 },
    { wch: 30 },
    { wch: 12 },
    { wch: 10 },
    { wch: 8 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Players");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
