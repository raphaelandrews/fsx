import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import type { PlayerById } from "./player-profile";

type HistoryRow = PlayerById["playersToTournaments"][number] & { category: string | null };

export const tournamentHistoryColumns: ColumnDef<HistoryRow>[] = [
  {
    accessorKey: "tournament.name",
    header: () => <div className="text-left">Evento</div>,
    cell: ({ row }) => (
      <Link
        to="/torneios/$id"
        params={{ id: row.original.tournament.id }}
        className="whitespace-nowrap text-left font-medium text-foreground underline-offset-4 hover:underline"
      >
        {row.original.tournament.name}
        {row.original.category ? <span className="ms-1.5 font-normal text-muted-foreground">· {row.original.category}</span> : null}
      </Link>
    ),
  },
  {
    accessorKey: "variation",
    header: "+/-",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">
        {row.original.oldRating}
        <span className={`${formatVariationColor(row.original.variation)} ms-2`}>
          {formatVariationSymbol(row.original.variation)}
          {row.original.variation}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "tournament.ratingType",
    header: "Tipo",
    cell: ({ row }) => (
      <p className="font-medium text-foreground">
        {formatRatingType(row.original.tournament.ratingType)}
      </p>
    ),
  },
];

export function formatVariationColor(variation: number | null | undefined) {
  if (variation == null) return "text-muted-foreground";
  if (variation > 0) return "text-success";
  if (variation === 0) return "text-warning-text";
  if (variation < 0) return "text-destructive";
  return "text-muted-foreground";
}

export function formatVariationSymbol(variation: number | null | undefined) {
  if (variation == null) return "?";
  if (variation > 0) return "+";
  if (variation === 0) return "=";
  return "";
}

export function formatRatingType(type: string | null | undefined) {
  const types = {
    classic: "Clássico",
    rapid: "Rápido",
    blitz: "Blitz",
  };
  return type ? (types[type as keyof typeof types] ?? "?") : "?";
}
