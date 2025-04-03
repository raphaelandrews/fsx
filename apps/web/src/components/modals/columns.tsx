import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "tournament_id",
    header: "Evento",
    cell: ({ row }) => {
      return (
        <p className="font-medium whitespace-nowrap">
          {row.original.tournaments.name}
          {/*{FormatTournament(row.original.tournamentID)}*/}
        </p>
      );
    },
  },
  {
    accessorKey: "variation",
    header: "+/-",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.old_rating}
          <span
            className={`${FormatVariationColor(row.original.variation)} ml-2`}
          >
            {FormatVariationSignal(row.original.variation)}
            {row.original.variation}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "ratingType",
    header: "Tipo",
    cell: ({ row }) => {
      return <p className="font-medium">{FormatRatingType(row.original.rating_type)}</p>;
    },
  },
];

export function FormatVariationColor(variation: number | null | undefined) {
  if (variation == null) {
    return "text-primary";
  }
  if (variation > 0) {
    return "text-teal-500";
  }
  if (variation === 0) {
    return "text-amber-500";
  }
  if (variation < 0) {
    return "text-red-600";
  }
  return "text-primary";
}

export function FormatVariationSignal(variation: number | null | undefined) {
  if (variation == null) {
    return "?";
  }
  if (variation > 0) {
    return "+";
  }
  if (variation === 0) {
    return "=";
  }
  if (variation < 0) {
    return "";
  }
  return "?";
}

export function FormatRatingType(type: string | null | undefined) {
    if (type == null) {
      return "?";
    }
    if (type === "classic" ) {
      return "Clássico";
    }
    if (type === "rapid") {
      return "Rápido";
    }
    if (type === "blitz") {
      return "Blitz";
    }
    return "?";
  }