import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import {
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@fsx/ui/components/button"
import { Input } from "@fsx/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table"

import { titledPlayersColumns, type TitledPlayer } from "./columns"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTablePagination } from "./data-table-pagination"
import { externalTitles, internalTitles } from "./data"

export function TitledPlayersTable({ data }: { data: TitledPlayer[] }) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns: titledPlayersColumns,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 flex-col items-start space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
            <Input
              className="h-8 w-[150px] border-dashed bg-background focus-visible:border-solid dark:bg-input/30 lg:w-[250px]"
              onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
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
                  <HugeiconsIcon className="ml-2 size-4" icon={Cancel01Icon} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="border-b-0" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead colSpan={header.colSpan} key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="border-b-0" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={titledPlayersColumns.length}>
                  Sem resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
