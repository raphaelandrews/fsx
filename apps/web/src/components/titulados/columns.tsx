import type { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/home/ratings/data-table-column-header"
import { PlayerActions } from "@/components/campeoes/actions"

export interface TitledPlayer {
  id: number
  name: string
  imageUrl: string | null
  rapid: number
  playersToTitles: Array<{
    title: { name: string; shortName: string; type: string }
  }>
}

export const titledPlayersColumns: ColumnDef<TitledPlayer>[] = [
  {
    id: "index",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    cell: ({ row, table }) =>
      (table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => {
      const shortTitle = row.original.playersToTitles?.find((t) => t.title)?.title.shortName
      return (
        <PlayerActions
          id={row.original.id}
          image={row.original.imageUrl}
          name={row.original.name}
          shortTitle={shortTitle}
        />
      )
    },
  },
  {
    accessorKey: "internalTitle",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título FSX" />,
    cell: ({ row }) => {
      const internalTitle = row.original.playersToTitles?.find(
        (title) => title.title.type === "internal"
      )
      return <p className="whitespace-nowrap">{internalTitle?.title.name}</p>
    },
    filterFn: (row, _id, value) => {
      const internalTitle = row.original.playersToTitles?.find(
        (title) => title.title.type === "internal"
      )
      return (value as string[]).includes(internalTitle?.title.shortName as string)
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "externalTitle",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título CBX/FIDE" />,
    cell: ({ row }) => {
      const externalTitle = row.original.playersToTitles?.find(
        (title) => title.title.type === "external"
      )
      return <p className="whitespace-nowrap">{externalTitle?.title.name || "-"}</p>
    },
    filterFn: (row, _id, value) => {
      const externalTitle = row.original.playersToTitles?.find(
        (title) => title.title.type === "external"
      )
      return (value as string[]).includes(externalTitle?.title.shortName as string)
    },
    enableSorting: false,
    enableHiding: false,
  },
]
