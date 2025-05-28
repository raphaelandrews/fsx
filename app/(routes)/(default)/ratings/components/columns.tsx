"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";

import { locations } from "../data/data";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Actions } from "./actions";
import type { Players } from "@/db/queries";

export const columns: ColumnDef<Players>[] = [
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

      if (playerTitles && playerTitles.length > 0 && playerTitles[0].title) {
        const shortTitle = playerTitles[0].title.shortTitle;
        return (
          <Actions
            id={row.original.id}
            name={row.original.name}
            nickname={row.original.nickname}
            image={row.original.imageUrl}
            shortTitle={shortTitle}
            defendingChampions={row.original.defendingChampions}
          />
        );
      }
      return (
        <Actions
          id={row.original.id}
          name={row.original.name}
          nickname={row.original.nickname}
          image={row.original.imageUrl}
          defendingChampions={row.original.defendingChampions}
        />
      );
    },
  },
  {
    accessorKey: "classic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clássico" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.classic}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "rapid",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rápido" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.rapid}</div>;
    },
    filterFn: (row, id, value) => {
      const playerTitles = row.original.playersToTitles;
      if (!playerTitles || playerTitles.length === 0) return false;

      return playerTitles.some(
        (pt) => pt.title && value.includes(pt.title.shortTitle)
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "blitz",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Blitz" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.blitz}</div>;
    },
    filterFn: (row, id, value) => {
      const playerSex = row.original.sex.toString();

      return value.includes(playerSex);
    },
    enableSorting: false,
  },
  {
    accessorKey: "locations",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Local" />
    ),
    cell: ({ row }) => {
      const locationName = row.original.location?.name;
      const location = locations.find(
        (location) => location.value === locationName
      );

      return (
        <div className="flex items-center gap-2">
          <Image
            src={
              row.original.location?.flag
                ? row.original.location?.flag
                : "/vercel.svg"
            }
            alt={
              row.original.location?.name ? row.original.location?.name : "FSX"
            }
            title={
              row.original.location?.name ? row.original.location?.name : "FSX"
            }
            className="w-4 h-4 rounded object-contain"
            width={20}
            height={20}
          />
          <div className="whitespace-nowrap">{row.original.location?.name}</div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const locationName = row.original.location?.name;
      return value.includes(locationName);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "clubs",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clube" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Image
            src={
              row.original.club?.logo ? row.original.club?.logo : "/vercel.svg"
            }
            alt={row.original.club?.name ? row.original.club?.name : "FSX"}
            title={row.original.club?.name ? row.original.club?.name : "FSX"}
            className="w-4 h-4 rounded object-contain"
            width={20}
            height={20}
          />
          <div className="whitespace-nowrap">{row.original.club?.name}</div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const clubName = row.original.club?.name;
      return value.includes(clubName);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="id" />
    ),
    cell: ({ row }) => {
      return <div className="w-[80px]">{row.getValue("id")}</div>;
    },
    filterFn: (row, id, value) => {
      const playerBirthYear = new Date(
        row.original.birth ? row.original.birth : "1900-01-01"
      ).getFullYear();
      const currentYear = new Date().getFullYear();

      const playerAgeGroup = (() => {
        const age = currentYear - playerBirthYear;
        if (age <= 8) return "sub-8";
        if (age <= 10) return "sub-10";
        if (age <= 12) return "sub-12";
        if (age <= 14) return "sub-14";
        if (age <= 16) return "sub-16";
        if (age <= 18) return "sub-18";
        if (age >= 40 && age < 50) return "master";
        if (age >= 50 && age < 65) return "veterano";
        if (age >= 65 && age < 100) return "senior";
        return null;
      })();

      return value.includes(playerAgeGroup);
    },
    enableSorting: false,
    enableHiding: false,
  },
];
