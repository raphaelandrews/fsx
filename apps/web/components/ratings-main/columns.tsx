"use client";

import type { ColumnDef, Row, Table } from "@tanstack/react-table";

import { DataTableColumnHeader } from "./data-table-column-header";
import { Actions } from "./actions";
import type { Player } from "@/schemas/players";

const commonColumns: ColumnDef<Player>[] = [
  {
    id: "index",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    cell: ({ row, table }: { row: Row<Player>; table: Table<Player> }) =>
      (table
        .getSortedRowModel()
        ?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }: { row: Row<Player> }) => {
      const playerTitles = row.original.playersToTitles;
      const shortTitle = playerTitles?.[0]?.title?.shortTitle;
      return (
        <Actions
          id={row.original.id}
          name={row.original.name}
          nickname={row.original.nickname}
          imageUrl={row.original.imageUrl}
          shortTitle={shortTitle}
          defendingChampions={row.original.defendingChampions}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

export const columnsClassic: ColumnDef<Player>[] = [
  ...commonColumns,
  {
    accessorKey: "classic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clássico" />
    ),
    cell: ({ row }: { row: Row<Player> }) => (
      <div className="font-medium">{row.original.classic}</div>
    ),
  },
];

export const columnsRapid: ColumnDef<Player>[] = [
  ...commonColumns,
  {
    accessorKey: "rapid",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rápido" />
    ),
    cell: ({ row }: { row: Row<Player> }) => (
      <div className="font-medium">{row.original.rapid}</div>
    ),
  },
];

export const columnsBlitz: ColumnDef<Player>[] = [
  ...commonColumns,
  {
    accessorKey: "blitz",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Blitz" />
    ),
    cell: ({ row }: { row: Row<Player> }) => (
      <div className="font-medium">{row.original.blitz}</div>
    ),
  },
];

