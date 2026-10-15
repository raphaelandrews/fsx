import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
} from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
	table: Table<TData>
}

export function DataTablePagination<TData>({
	table,
}: DataTablePaginationProps<TData>) {
	return (
		<div className="flex items-center justify-end">
			{/*<div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>*/}
			<div className="flex flex-col items-end space-y-3 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="font-medium text-sm">Jogadores por página</p>
					<Select
						onValueChange={(value) => {
							table.setPageSize(Number(value))
						}}
						value={`${table.getState().pagination.pageSize}`}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center space-x-2 lg:space-x-4">
					<div className="flex items-center justify-center font-medium text-sm">
						Página {table.getState().pagination.pageIndex + 1} de{" "}
						{table.getPageCount()}
					</div>
					<div className="flex items-center space-x-2">
						<Button
							className="hidden h-8 w-8 p-0 lg:flex"
							disabled={!table.getCanPreviousPage()}
							onClick={() => table.setPageIndex(0)}
							variant="dashed"
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeftIcon className="h-4 w-4" />
						</Button>
						<Button
							className="h-8 w-8 p-0"
							disabled={!table.getCanPreviousPage()}
							onClick={() => table.previousPage()}
							variant="dashed"
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeftIcon className="h-4 w-4" />
						</Button>
						<Button
							className="mr-0 h-8 w-8 p-0 lg:mr-2"
							disabled={!table.getCanNextPage()}
							onClick={() => table.nextPage()}
							variant="dashed"
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
						<Button
							className="hidden h-8 w-8 p-0 lg:flex"
							disabled={!table.getCanNextPage()}
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							variant="dashed"
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRightIcon className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
