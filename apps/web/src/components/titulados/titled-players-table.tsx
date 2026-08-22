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
import {
  EmptyTableRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { SearchInput } from "@/components/data-table/search-input"
import { titledPlayersColumns, type TitledPlayer } from "./columns"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            placeholder="Procurar jogadores..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            widthClass="w-full sm:w-[250px]"
          />
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

      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <EmptyTableRow colSpan={titledPlayersColumns.length}>
                Sem resultados.
              </EmptyTableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4">
        <DataTablePagination table={table} pageSizeOptions={[10, 20, 30, 40, 50]} />
      </div>
    </div>
  )
}
