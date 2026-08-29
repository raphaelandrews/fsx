import type { ColumnDef, RowData } from "@tanstack/react-table";

import { PlayerActions } from "@/components/campeoes/actions";
import { DataTableColumnHeader } from "@/components/home/ratings/data-table-column-header";
import { getInitials } from "@/lib/initials";

import type { ClubRow, PlayerRow } from "./types";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

function indexColumn<T>(): ColumnDef<T> {
  return {
    id: "index",
    header: ({ column }) => (
      <DataTableColumnHeader className="justify-center" column={column} title="#" />
    ),
    cell: ({ row, table }) =>
      (table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1,
    enableSorting: false,
    enableHiding: false,
    meta: { className: "w-10 text-center text-muted-foreground tabular-nums" },
  };
}

function totalColumn<T extends { total: number }>(): ColumnDef<T> {
  return {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader className="justify-center" column={column} title="Total" />
    ),
    cell: ({ row }) =>
      row.original.total > 0 ? (
        <span className="font-semibold tabular-nums">{row.original.total}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    meta: { className: "w-20 text-center" },
  };
}

function phaseColumns<T extends { pointsByPhase: Record<string, number> }>(
  phases: string[],
): ColumnDef<T>[] {
  return phases.map((phase) => ({
    id: phase,
    accessorFn: (row: T) => row.pointsByPhase[phase] ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader className="justify-center" column={column} title={phase} />
    ),
    cell: ({ row }) => {
      const points = row.original.pointsByPhase[phase];
      return points && points > 0 ? (
        <span className="tabular-nums">{points}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    meta: { className: "w-20 text-center" },
  }));
}

export function buildPlayerColumns(
  phases: string[],
  opts: { showCategory?: boolean } = {},
): ColumnDef<PlayerRow>[] {
  const columns: ColumnDef<PlayerRow>[] = [
    indexColumn<PlayerRow>(),
    {
      id: "name",
      accessorFn: (row) => row.nickname ?? row.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => {
        const player = row.original;
        const shortTitle = player.playersToTitles?.find((t) => t.title)?.title.shortName ?? null;
        return (
          <PlayerActions
            id={player.id}
            image={player.imageUrl}
            name={player.name}
            nickname={player.nickname}
            shortTitle={shortTitle}
          />
        );
      },
    },
  ];

  if (opts.showCategory) {
    columns.push({
      id: "category",
      accessorFn: (row) => row.categories.join(", "),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
      cell: ({ row }) => {
        const categories = row.original.categories;
        if (categories.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <span className="text-xs text-muted-foreground">{categories.join(", ")}</span>;
      },
      enableSorting: false,
    });
  }

  columns.push(totalColumn<PlayerRow>(), ...phaseColumns<PlayerRow>(phases));
  return columns;
}

export function buildClubColumns(phases: string[]): ColumnDef<ClubRow>[] {
  return [
    indexColumn<ClubRow>(),
    {
      id: "club",
      accessorFn: (row) => row.clubName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clube" />,
      cell: ({ row }) => {
        const club = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="relative flex shrink-0 h-5 w-5 overflow-hidden rounded">
              {club.clubLogo ? (
                <img
                  alt={club.clubName}
                  className="aspect-square size-full object-contain"
                  src={club.clubLogo}
                />
              ) : (
                <span className="flex aspect-square size-full items-center justify-center rounded bg-muted">
                  <span className="text-xs uppercase text-foreground">
                    {getInitials(club.clubName)}
                  </span>
                </span>
              )}
            </span>
            <span className="font-medium whitespace-nowrap">{club.clubName}</span>
          </div>
        );
      },
    },
    totalColumn<ClubRow>(),
    ...phaseColumns<ClubRow>(phases),
  ];
}
