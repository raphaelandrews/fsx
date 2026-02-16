"use client"

import { useSearchParams } from "next/navigation"
import type { Table } from "@tanstack/react-table"
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
} from "lucide-react"

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
	totalPages: number
}

export function DataTablePagination<TData>({
	table,
	totalPages,
}: DataTablePaginationProps<TData>) {
	const searchParams = useSearchParams()

	const currentPage = Number(searchParams.get("page")) || 1
	const currentPageSize = Number(searchParams.get("limit")) || 20

	const createQueryString = (params: Record<string, string>) => {
		const newSearchParams = new URLSearchParams(searchParams.toString())
		for (const [key, value] of Object.entries(params)) {
			newSearchParams.set(key, value)
		}
		return newSearchParams.toString()
	}

	const handlePageChange = (page: number) => {
		const queryString = createQueryString({ page: page.toString() })
		window.location.href = `/ratings?${queryString}`
	}

	const handlePageSizeChange = (size: number) => {
		table.setPageSize(size)
		const queryString = createQueryString({
			limit: size.toString(),
			page: "1",
		})
		window.location.href = `/ratings?${queryString}`
	}

	return (
		<div className="flex items-center justify-end">
			<div className="flex flex-col items-end space-y-3 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="font-medium text-sm">Jogadores por página</p>
					<Select
						onValueChange={(value) => {
							handlePageSizeChange(Number(value))
						}}
						value={`${currentPageSize}`}
					>
						<SelectTrigger className="h-8 w-[70px] border-dashed">
							<SelectValue
								placeholder={
									currentPageSize || table.getState().pagination.pageSize
								}
							/>
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
						Página {currentPage} de {totalPages || table.getPageCount()}
					</div>
					<div className="flex items-center space-x-2">
						<Button
							className="hidden h-8 w-8 p-0 lg:flex"
							disabled={currentPage <= 1}
							onClick={() => handlePageChange(1)}
							variant="dashed"
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeftIcon className="h-4 w-4" />
						</Button>
						<Button
							className="h-8 w-8 p-0"
							disabled={currentPage <= 1}
							onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
							variant="dashed"
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeftIcon className="h-4 w-4" />
						</Button>
						<Button
							className="mr-0 h-8 w-8 p-0 lg:mr-2"
							disabled={currentPage >= totalPages}
							onClick={() => handlePageChange(currentPage + 1)}
							variant="dashed"
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
						<Button
							className="hidden h-8 w-8 p-0 lg:flex"
							disabled={currentPage >= totalPages}
							onClick={() => handlePageChange(totalPages)}
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
