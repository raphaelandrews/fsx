"use client"

import { XIcon } from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { categories } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { Button } from "@/components/ui/button"

interface DataTableToolbarProps<TData> {
	table: Table<TData>
}

export function DataTableToolbar<TData>({
	table,
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
				{table.getColumn("category") && (
					<DataTableFacetedFilter
						column={table.getColumn("category")}
						options={categories}
						title="Categoria"
					/>
				)}
				{isFiltered && (
					<Button
						className="h-8 px-2 lg:px-3"
						onClick={() => table.resetColumnFilters()}
						variant="ghost"
					>
						Limpar
						<XIcon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}
