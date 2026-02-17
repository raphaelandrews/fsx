"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type LinkGroupTableData = {
	id: number
	label: string
	linksCount: number
}

export const columns: ColumnDef<LinkGroupTableData>[] = [
	{
		accessorKey: "id",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="ID" />
		),
		cell: ({ row }) => <div className="w-[40px]">{row.getValue("id")}</div>,
		enableHiding: false,
	},
	{
		accessorKey: "label",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Label" />
		),
		cell: ({ row }) => {
			return (
				<div className="flex space-x-2">
					<span className="max-w-[300px] truncate font-medium">
						{row.getValue("label")}
					</span>
				</div>
			)
		},
		enableHiding: false,
	},
	{
		accessorKey: "linksCount",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Links" />
		),
		cell: ({ row }) => {
			const count = row.getValue("linksCount") as number
			return (
				<div className="w-[80px]">
					<span className="text-sm text-muted-foreground">
						{count} {count === 1 ? "link" : "links"}
					</span>
				</div>
			)
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
]
