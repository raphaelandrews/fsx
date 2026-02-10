"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type LocationTableData = {
	id: number
	name: string
	type: "city" | "state" | "country"
	flag: string | null
}

const typeLabels = {
	city: "City",
	state: "State",
	country: "Country",
}

export const columns: ColumnDef<LocationTableData>[] = [
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
		accessorKey: "flag",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Flag" />
		),
		cell: ({ row }) => {
			const flag = row.getValue("flag") as string | null
			return (
				<div className="w-[200px]">
					{flag ? (
						<span className="truncate text-sm text-muted-foreground">{flag}</span>
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
