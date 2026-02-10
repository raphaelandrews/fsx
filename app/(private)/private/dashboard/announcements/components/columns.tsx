"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type AnnouncementTableData = {
	id: number
	year: number
	number: string
	content: string
}

function truncateContent(content: string, maxLength = 80) {
	if (content.length <= maxLength) return content
	return content.slice(0, maxLength) + "..."
}

export const columns: ColumnDef<AnnouncementTableData>[] = [
	{
		accessorKey: "id",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="ID" />
		),
		cell: ({ row }) => <div className="w-[40px]">{row.getValue("id")}</div>,
		enableHiding: false,
	},
	{
		accessorKey: "number",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Number" />
		),
		cell: ({ row }) => {
			return (
				<div className="w-[60px] font-medium">{row.getValue("number")}</div>
			)
		},
		enableHiding: false,
	},
	{
		accessorKey: "year",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Year" />
		),
		cell: ({ row }) => {
			return <div className="w-[60px]">{row.getValue("year")}</div>
		},
	},
	{
		accessorKey: "content",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Content" />
		),
		cell: ({ row }) => {
			const content = row.getValue("content") as string
			return (
				<div className="max-w-[400px]">
					<span className="truncate">{truncateContent(content)}</span>
				</div>
			)
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
]
