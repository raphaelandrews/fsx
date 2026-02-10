"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type EventTableData = {
	id: number
	name: string
	startDate: Date
	endDate: Date | null
	type: "open" | "closed" | "school"
	timeControl: "standard" | "rapid" | "blitz" | "bullet"
}

const typeLabels = {
	open: "Open",
	closed: "Closed",
	school: "School",
}

const timeControlLabels = {
	standard: "Standard",
	rapid: "Rapid",
	blitz: "Blitz",
	bullet: "Bullet",
}

function formatDate(date: Date) {
	return new Date(date).toLocaleDateString("pt-BR")
}

export const columns: ColumnDef<EventTableData>[] = [
	{
		accessorKey: "id",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="ID" />
		),
		cell: ({ row }) => <div className="w-[40px]">{row.getValue("id")}</div>,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => {
			return (
				<div className="flex space-x-2">
					<span className="max-w-[300px] truncate font-medium">
						{row.getValue("name")}
					</span>
				</div>
			)
		},
		enableHiding: false,
	},
	{
		accessorKey: "startDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Start Date" />
		),
		cell: ({ row }) => {
			const date = row.getValue("startDate") as Date
			return <div className="w-[100px]">{formatDate(date)}</div>
		},
	},
	{
		accessorKey: "endDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="End Date" />
		),
		cell: ({ row }) => {
			const date = row.getValue("endDate") as Date | null
			return <div className="w-[100px]">{date ? formatDate(date) : "-"}</div>
		},
	},
	{
		accessorKey: "type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Type" />
		),
		cell: ({ row }) => {
			const type = row.getValue("type") as keyof typeof typeLabels
			return <div className="w-[80px]">{typeLabels[type]}</div>
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	},
	{
		accessorKey: "timeControl",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Time Control" />
		),
		cell: ({ row }) => {
			const timeControl = row.getValue("timeControl") as keyof typeof timeControlLabels
			return <div className="w-[80px]">{timeControlLabels[timeControl]}</div>
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
]
