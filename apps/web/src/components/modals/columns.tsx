import type { ColumnDef } from "@tanstack/react-table";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "tournament_id",
    header: "Evento",
    cell: ({ row }) => (
      <p className="font-medium whitespace-nowrap text-foreground">
        {row.original.tournament.name}
      </p>
    ),
  },
  {
    accessorKey: "variation",
    header: "+/-",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">
        {row.original.oldRating}
        <span
          className={`${formatVariationColor(row.original.variation)} ms-2`}
        >
          {formatVariationSymbol(row.original.variation)}
          {row.original.variation}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "ratingType",
    header: "Tipo",
    cell: ({ row }) => (
      <p className="font-medium text-foreground">
        {formatRatingType(row.original.ratingType)}
      </p>
    ),
  },
];

export function formatVariationColor(variation: number | null | undefined) {
  if (variation == null) return "text-primary";
  if (variation > 0) return "text-success";
  if (variation === 0) return "text-warning";
  if (variation < 0) return "text-destructive";
  return "text-primary";
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
