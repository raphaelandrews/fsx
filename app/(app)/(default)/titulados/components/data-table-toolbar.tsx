"use client"

import { XIcon } from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { externalTitles, internalTitles } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
	table: Table<TData>
}

export function DataTableToolbar<TData>({
	table,
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-col items-start space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
				<Input
					className="h-8 w-[150px] lg:w-[250px] border-dashed bg-background focus-visible:border-solid dark:bg-input/30"
					onChange={(event) =>
						table.getColumn("name")?.setFilterValue(event.target.value)
					}
					placeholder="Procurar jogadores..."
					value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
				/>
				<div className="flex flex-1 flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
					{table.getColumn("internalTitle") && (
						<DataTableFacetedFilter
							column={table.getColumn("internalTitle")}
							options={internalTitles}
							title="FSX"
						/>
					)}
					{table.getColumn("externalTitle") && (
						<DataTableFacetedFilter
							column={table.getColumn("externalTitle")}
							options={externalTitles}
							title="CBX/FIDE"
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
			{/*<DataTableViewOptions table={table} />*/}
		</div>
	)
}
