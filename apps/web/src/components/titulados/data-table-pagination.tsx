import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons"
import type { Table } from "@tanstack/react-table"

import { Button } from "@fsx/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-end">
      <div className="flex flex-col items-end space-y-3 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Jogadores por página</p>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
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
          <div className="flex items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="h-8 w-8 p-0 border-dashed"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              variant="outline"
            >
              <span className="sr-only">Ir para a página anterior</span>
              <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
            </Button>
            <Button
              className="h-8 w-8 p-0 border-dashed"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              variant="outline"
            >
              <span className="sr-only">Ir para a próxima página</span>
              <HugeiconsIcon className="size-4" icon={ArrowRight02Icon} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
