"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { TitledPlayer } from "@/db/queries";

import { DataTableColumnHeader } from "./data-table-column-header";
import { Actions } from "./actions";

export const columns: ColumnDef<TitledPlayer>[] = [
  {
    id: "index",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    cell: ({ row, table }) =>
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
    cell: ({ row }) => {
      const playerTitles = row.original.playersToTitles;
      const shortTitle = playerTitles?.find((title) => title.title)?.title
        .shortTitle;
      return (
        <Actions
          id={row.original.id}
          name={row.original.name}
          image={row.original.imageUrl}
          shortTitle={shortTitle}
        />
      );
    },
  },
  {
    accessorKey: "internalTitle",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Título FSX" />
    ),
    cell: ({ row }) => {
      const internalTitle = useMemo(() => {
        return row.original.playersToTitles?.find(
          (title) => title.title.type === "internal"
        );
      }, [row.original.playersToTitles]);

      return <p className="whitespace-nowrap">{internalTitle?.title.title}</p>;
    },
    filterFn: (row, _id, value) => {
      const internalTitle = row.original.playersToTitles?.find(
        (title) => title.title.type === "internal"
      );
      return value.includes(internalTitle?.title.shortTitle);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "externalTitle",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Título CBX/FIDE" />
    ),
    cell: ({ row }) => {
      const externalTitle = useMemo(() => {
        return row.original.playersToTitles?.find(
          (title) => title.title.type === "external"
        );
      }, [row.original.playersToTitles]);

      return (
        <p className="whitespace-nowrap">{externalTitle?.title.title || "-"}</p>
      );
    },
    filterFn: (row, _id, value) => {
      const externalTitle = row.original.playersToTitles?.find(
        (title) => title.title.type === "external"
      );
      return value.includes(externalTitle?.title.shortTitle);
    },
    enableSorting: false,
    enableHiding: false,
  },
];
