"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { TopPlayer } from "@/db/queries"

import { DataTableColumnHeader } from "./data-table-column-header"
import { Actions } from "./actions"

export const columnsClassic: ColumnDef<TopPlayer>[] = [
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
			const playerTitles = row.original.playersToTitles
			if (playerTitles && playerTitles.length > 0 && playerTitles[0].title) {
				const shortTitle = playerTitles[0].title.shortTitle
				return (
					<Actions
						defendingChampions={row.original.defendingChampions}
						id={row.original.id}
						image={row.original.imageUrl}
						name={row.original.name}
						nickname={row.original.nickname}
						shortTitle={shortTitle}
					/>
				)
			}
			return (
				<Actions
					defendingChampions={row.original.defendingChampions}
					id={row.original.id}
					image={row.original.imageUrl}
					name={row.original.name}
					nickname={row.original.nickname}
				/>
			)
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "classic",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Clássico" />
		),
		cell: ({ row }) => {
			return <div className="font-medium">{row.original.classic}</div>
		},
		enableSorting: false,
		enableHiding: false,
	},
]

export const columnsRapid: ColumnDef<TopPlayer>[] = [
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
			const playerTitles = row.original.playersToTitles
			if (playerTitles && playerTitles.length > 0 && playerTitles[0].title) {
				const shortTitle = playerTitles[0].title.shortTitle
				return (
					<Actions
						defendingChampions={row.original.defendingChampions}
						id={row.original.id}
						image={row.original.imageUrl}
						name={row.original.name}
						nickname={row.original.nickname}
						shortTitle={shortTitle}
					/>
				)
			}
			return (
				<Actions
					defendingChampions={row.original.defendingChampions}
					id={row.original.id}
					image={row.original.imageUrl}
					name={row.original.name}
					nickname={row.original.nickname}
				/>
			)
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "rapid",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Rápido" />
		),
		cell: ({ row }) => {
			return <div className="font-medium">{row.original.rapid}</div>
		},
		enableSorting: false,
		enableHiding: false,
	},
]

export const columnsBlitz: ColumnDef<TopPlayer>[] = [
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
			const playerTitles = row.original.playersToTitles
			if (playerTitles && playerTitles.length > 0 && playerTitles[0].title) {
				const shortTitle = playerTitles[0].title.shortTitle
				return (
					<Actions
						defendingChampions={row.original.defendingChampions}
						id={row.original.id}
						image={row.original.imageUrl}
						name={row.original.name}
						nickname={row.original.nickname}
						shortTitle={shortTitle}
					/>
				)
			}
			return (
				<Actions
					defendingChampions={row.original.defendingChampions}
					id={row.original.id}
					image={row.original.imageUrl}
					name={row.original.name}
					nickname={row.original.nickname}
				/>
			)
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "blitz",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Blitz" />
		),
		cell: ({ row }) => {
			return <div className="font-medium">{row.original.blitz}</div>
		},
		enableSorting: false,
		enableHiding: false,
	},
]
