import { useSearchParams } from "next/navigation"
import type { ColumnDef, Row } from "@tanstack/react-table"

import type { Players } from "@/db/queries"
import { LOGO_FALLBACK } from "@/lib/utils"

import { Actions } from "./actions"
import { DataTableColumnHeader } from "./data-table-column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function getRowIndex(row: Row<Players>) {
	const searchParams = useSearchParams()
	const currentPage = Number(searchParams.get("page")) || 1
	const pageSize = Number(searchParams.get("limit")) || 20

	return pageSize * (currentPage - 1) + row.index + 1
}

export const columnsClassic: ColumnDef<Players>[] = [
	{
		id: "index",
		header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
		cell: ({ row }) => getRowIndex(row),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nome" />
		),
		cell: ({ row }) => {
			const player = row.original
			return (
				<Actions
					defendingChampions={player.defendingChampions}
					id={player.id}
					imageUrl={player.imageUrl}
					name={player.name}
					nickname={player.nickname}
					playersToTitles={player.playersToTitles}
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
	{
		accessorKey: "locations",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Local" />
		),
		cell: ({ row }) => {
			return (
				<div className="flex items-center gap-2">
					<Avatar className="size-4 rounded object-contain">
						<AvatarImage
							alt={row.original.location?.name as string}
							className="size-4 rounded object-contain"
							src={
								(row.original.location?.flag as string)
									? (row.original.location?.flag as string)
									: LOGO_FALLBACK
							}
							title={row.original.location?.name as string}
						/>
						<AvatarFallback className="size-4 rounded-none object-contain" />
					</Avatar>
					<div className="whitespace-nowrap">
						{row.original.location?.name as string}
					</div>
				</div>
			)
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
					<Avatar className="size-4 rounded object-contain">
						<AvatarImage
							alt={row.original.club?.name as string}
							className="size-4 rounded object-contain"
							src={
								(row.original.club?.logo as string)
									? (row.original.club?.logo as string)
									: LOGO_FALLBACK
							}
							title={row.original.club?.name as string}
						/>
						<AvatarFallback className="size-4 rounded-none object-contain" />
					</Avatar>
					<div className="whitespace-nowrap">
						{row.original.club?.name as string}
					</div>
				</div>
			)
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
			return <div className="w-[80px]">{row.getValue("id")}</div>
		},
		enableSorting: false,
		enableHiding: false,
	},
]

export const columnsRapid: ColumnDef<Players>[] = [
	{
		id: "index",
		header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
		cell: ({ row }) => getRowIndex(row),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nome" />
		),
		cell: ({ row }) => {
			const player = row.original
			return (
				<Actions
					defendingChampions={player.defendingChampions}
					id={player.id}
					imageUrl={player.imageUrl}
					name={player.name}
					nickname={player.nickname}
					playersToTitles={player.playersToTitles}
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
	{
		accessorKey: "locations",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Local" />
		),
		cell: ({ row }) => {
			return (
				<div className="flex items-center gap-2">
					<Avatar className="size-4 rounded object-contain">
						<AvatarImage
							alt={row.original.location?.name as string}
							className="size-4 rounded object-contain"
							src={
								(row.original.location?.flag as string)
									? (row.original.location?.flag as string)
									: LOGO_FALLBACK
							}
							title={row.original.location?.name as string}
						/>
						<AvatarFallback className="size-4 rounded-none object-contain" />
					</Avatar>
					<div className="whitespace-nowrap">
						{row.original.location?.name as string}
					</div>
				</div>
			)
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
					<Avatar className="size-4 rounded object-contain">
						<AvatarImage
							alt={row.original.club?.name as string}
							className="size-4 rounded object-contain"
							src={
								(row.original.club?.logo as string)
									? (row.original.club?.logo as string)
									: LOGO_FALLBACK
							}
							title={row.original.club?.name as string}
						/>
						<AvatarFallback className="size-4 rounded-none object-contain" />
					</Avatar>
					<div className="whitespace-nowrap">
						{row.original.club?.name as string}
					</div>
				</div>
			)
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
			return <div className="w-[80px]">{row.getValue("id")}</div>
		},
		enableSorting: false,
		enableHiding: false,
	},
]

export const columnsBlitz: ColumnDef<Players>[] = [
	{
		id: "index",
		header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
		cell: ({ row }) => getRowIndex(row),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nome" />
		),
		cell: ({ row }) => {
			const player = row.original
			return (
				<Actions
					defendingChampions={player.defendingChampions}
					id={player.id}
					imageUrl={player.imageUrl}
					name={player.name}
					nickname={player.nickname}
					playersToTitles={player.playersToTitles}
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
	{
		accessorKey: "locations",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Local" />
		),
		cell: ({ row }) => {
			return (
				<div className="flex items-center gap-2">
					<Avatar className="size-4 rounded object-contain">
						<AvatarImage
							alt={row.original.location?.name as string}
							className="size-4 rounded object-contain"
							src={
								(row.original.location?.flag as string)
									? (row.original.location?.flag as string)
									: LOGO_FALLBACK
							}
							title={row.original.location?.name as string}
						/>
						<AvatarFallback className="size-4 rounded-none object-contain" />
					</Avatar>
					<div className="whitespace-nowrap">
						{row.original.location?.name as string}
					</div>
				</div>
			)
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
					<Avatar className="size-4 rounded object-contain">
						<AvatarImage
							alt={row.original.club?.name as string}
							className="size-4 rounded object-contain"
							src={
								(row.original.club?.logo as string)
									? (row.original.club?.logo as string)
									: LOGO_FALLBACK
							}
							title={row.original.club?.name as string}
						/>
						<AvatarFallback className="size-4 rounded-none object-contain" />
					</Avatar>
					<div className="whitespace-nowrap">
						{row.original.club?.name as string}
					</div>
				</div>
			)
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
			return <div className="w-[80px]">{row.getValue("id")}</div>
		},
		enableSorting: false,
		enableHiding: false,
	},
]
