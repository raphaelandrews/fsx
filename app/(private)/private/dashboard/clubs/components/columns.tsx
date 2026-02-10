"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type ClubTableData = {
	id: number
	name: string
	logo: string | null
}

export const columns: ColumnDef<ClubTableData>[] = [
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
		accessorKey: "logo",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Logo" />
		),
		cell: ({ row }) => {
			const logo = row.getValue("logo") as string | null
			return (
				<div className="w-[200px]">
					{logo ? (
						<span className="truncate text-sm text-muted-foreground">{logo}</span>
					) : (
						<span className="text-sm text-muted-foreground">-</span>
					)}
				</div>
			)
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
]
