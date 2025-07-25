import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
} from "lucide-react"
import type { Table } from "@tanstack/react-table"

interface DataTablePaginationProps<TData> {
	table: Table<TData>
}

export function DataTablePagination<TData>({
	table,
}: DataTablePaginationProps<TData>) {
	return (
		<div className="flex items-center justify-between px-2">
			<div className="flex-1 text-muted-foreground text-sm">
				{table.getFilteredSelectedRowModel().rows.length} of{" "}
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div>
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="font-medium text-sm">Rows per page</p>
					<Select
						onValueChange={(value) => {
							table.setPageSize(Number(value))
						}}
						value={`${table.getState().pagination.pageSize}`}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent className="font-sans" side="top">
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center font-medium text-sm">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{table.getPageCount()}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						className="hidden h-8 w-8 p-0 lg:flex"
						disabled={!table.getCanPreviousPage()}
						onClick={() => table.setPageIndex(0)}
						variant="outline"
					>
						<span className="sr-only">Go to first page</span>
						<ChevronsLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						className="h-8 w-8 p-0"
						disabled={!table.getCanPreviousPage()}
						onClick={() => table.previousPage()}
						variant="outline"
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						className="h-8 w-8 p-0"
						disabled={!table.getCanNextPage()}
						onClick={() => table.nextPage()}
						variant="outline"
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRightIcon className="h-4 w-4" />
					</Button>
					<Button
						className="hidden h-8 w-8 p-0 lg:flex"
						disabled={!table.getCanNextPage()}
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						variant="outline"
					>
						<span className="sr-only">Go to last page</span>
						<ChevronsRightIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
