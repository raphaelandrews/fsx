"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { XIcon } from "lucide-react"
import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "./data-table-view-options"
import { LinkGroupCreateDialog } from "./link-group-create-dialog"

interface DataTableToolbarProps<TData> {
	table: Table<TData>
}

export function DataTableToolbar<TData>({
	table,
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<Input
					className="h-8 w-[150px] lg:w-[250px]"
					onChange={(event) =>
						table.getColumn("label")?.setFilterValue(event.target.value)
					}
					placeholder="Filter link groups..."
					value={(table.getColumn("label")?.getFilterValue() as string) ?? ""}
				/>
				{isFiltered && (
					<Button
						className="h-8 px-2 lg:px-3"
						onClick={() => table.resetColumnFilters()}
						variant="ghost"
					>
						Reset
						<XIcon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<div className="flex items-center space-x-2">
				<LinkGroupCreateDialog />
				<DataTableViewOptions table={table} />
			</div>
		</div>
	)
}
