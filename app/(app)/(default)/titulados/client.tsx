"use client"

import * as React from "react"
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { XIcon } from "lucide-react"

import type { TitledPlayer } from "@/db/queries"
import { DottedSeparator } from "@/components/dotted-separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { columns } from "./components/columns"
import { DataTableFacetedFilter } from "./components/data-table-faceted-filter"
import { DataTablePagination } from "./components/data-table-pagination"
import { externalTitles, internalTitles } from "./data/data"

interface TituladosClientProps {
  data: TitledPlayer[]
}

export function Client({ data }: TituladosClientProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              placeholder="Procurar jogadores..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
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
        </div>
      </div>

      <DottedSeparator />

      <div className="relative p-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="border-b-0" key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead colSpan={header.colSpan} key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="border-b-0"
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  Sem resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DottedSeparator />

      <div className="p-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
