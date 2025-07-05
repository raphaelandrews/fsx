"use client"

import { PanelLeftOpenIcon, PanelTopOpenIcon } from "lucide-react"
import type { CellContext, Column, ColumnDef } from "@tanstack/react-table"

import type { CircuitPhase, CircuitPlayer, CircuitClub } from "./types"

import { DataTableColumnHeader } from "./data-table-column-header"
import { Actions } from "./actions"
import { ActionsClub } from "./actions-club"
import { Button } from "@/components/ui/button"

export const circuitTotalColumns = (
	phases: CircuitPhase[]
): ColumnDef<CircuitPlayer>[] => {
	const sortedPhases = phases.sort((a, b) => b.order - a.order)

	return [
		{
			id: "index",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="#" />
			),
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
							id={row.original.id}
							imageUrl={row.original.imageUrl}
							name={row.original.name}
							nickname={row.original.nickname}
							shortTitle={shortTitle}
						/>
					)
				}
				return (
					<Actions
						id={row.original.id}
						imageUrl={row.original.imageUrl}
						name={row.original.name}
						nickname={row.original.nickname}
					/>
				)
			},
		},
		{
			accessorKey: "total",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Total" />
			),
			cell: ({ row }: CellContext<CircuitPlayer, unknown>) => {
				const totalPoints = row.original.total
				return totalPoints !== undefined && totalPoints > 0 ? totalPoints : "-"
			},
		},
		...sortedPhases.map((phase) => ({
			accessorKey: phase.tournament.name,
			header: ({ column }: { column: Column<CircuitPlayer> }) => (
				<DataTableColumnHeader column={column} title={phase.tournament.name} />
			),
			cell: ({ row }: CellContext<CircuitPlayer, unknown>) => {
				const points =
					row.original[phase.tournament.name as keyof CircuitPlayer]
				return typeof points === "number" && points > 0 ? points : "-"
			},
		})),
	]
}

export const circuitClubsColumns = (
	phases: CircuitPhase[]
): ColumnDef<CircuitClub>[] => {
	const sortedPhases = phases.sort((a, b) => b.order - a.order)

	return [
		{
			id: "expander",
			header: () => null,
			cell: ({ row }) => {
				return row.getCanExpand() ? (
					<Button
						{...{
							onClick: row.getToggleExpandedHandler(),
							style: { cursor: "pointer" },
						}}
						className="h-8 p-0 hover:bg-transparent hover:text-tertiary"
						variant="ghost"
					>
						{row.getIsExpanded() ? (
							<PanelTopOpenIcon height={16} width={16} />
						) : (
							<PanelLeftOpenIcon height={16} width={16} />
						)}
					</Button>
				) : (
					"🔵"
				)
			},
		},
		{
			id: "index",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="#" />
			),
			cell: ({ row, table }) =>
				(table
					.getSortedRowModel()
					?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1,
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "clubName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Nome" />
			),
			cell: ({ row }) => (
				<ActionsClub
					id={row.original.clubId || 0}
					imageUrl={row.original.clubLogo}
					name={row.original.clubName}
				/>
			),
		},
		{
			accessorKey: "total",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Total" />
			),
			cell: ({ row }: CellContext<CircuitClub, unknown>) => {
				const totalPoints = row.original.total
				return totalPoints > 0 ? totalPoints : "-"
			},
		},
		...sortedPhases.map((phase) => ({
			accessorKey: phase.tournament.name,
			header: ({ column }: { column: Column<CircuitClub> }) => (
				<DataTableColumnHeader column={column} title={phase.tournament.name} />
			),
			cell: ({ row }: CellContext<CircuitClub, unknown>) => {
				const points = row.original.pointsByPhase[phase.tournament.name]
				return typeof points === "number" && points > 0 ? points : "-"
			},
		})),
	]
}

export const circuitSchoolSubcomponentColumns = (
	phases: CircuitPhase[]
): ColumnDef<CircuitPlayer>[] => {
	const sortedPhases = phases.sort((a, b) => b.order - a.order)

	return [
		{
			id: "index",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="#" />
			),
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
							id={row.original.id}
							imageUrl={row.original.imageUrl}
							name={row.original.name}
							nickname={row.original.nickname}
							shortTitle={shortTitle}
						/>
					)
				}
				return (
					<Actions
						id={row.original.id}
						imageUrl={row.original.imageUrl}
						name={row.original.name}
						nickname={row.original.nickname}
					/>
				)
			},
		},
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Categoria" />
			),
			filterFn: (row, _id, value) => {
				const categoryName = row.original.category
				return value.includes(categoryName)
			},
		},
		{
			accessorKey: "total",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Total" />
			),
			cell: ({ row }: CellContext<CircuitPlayer, unknown>) => {
				const totalPoints = row.original.total
				return totalPoints !== undefined && totalPoints > 0 ? totalPoints : "-"
			},
		},
		...sortedPhases.map((phase) => ({
			accessorKey: phase.tournament.name,
			header: ({ column }: { column: Column<CircuitPlayer> }) => (
				<DataTableColumnHeader column={column} title={phase.tournament.name} />
			),
			cell: ({ row }: CellContext<CircuitPlayer, unknown>) => {
				const points =
					row.original[phase.tournament.name as keyof CircuitPlayer]
				return typeof points === "number" && points > 0 ? points : "-"
			},
		})),
	]
}
