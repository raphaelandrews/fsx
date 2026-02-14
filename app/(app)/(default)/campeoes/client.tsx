"use client"

import * as React from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { TrophyIcon } from "lucide-react"

import { DottedSeparator } from "@/components/dotted-separator"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { columns } from "./components/columns"

interface CampeoesClientProps {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  championshipMap: Record<string, any>
}

const tabContent = [
  { value: "classic", name: "Absoluto" },
  { value: "rapid", name: "Rápido" },
  { value: "blitz", name: "Blitz" },
  { value: "female", name: "Feminino" },
  { value: "bullet", name: "Bullet" },
  { value: "team", name: "Equipes" },
]

export function Client({ championshipMap }: CampeoesClientProps) {
  return (
    <Tabs defaultValue="classic" className="w-full gap-0">
      <TabsList className="h-auto w-full rounded-none bg-transparent p-0">
        {tabContent.map((tab, index) => (
          <React.Fragment key={tab.value}>
            <TabsTrigger
              className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
              value={tab.value}
            >
              {tab.name}
            </TabsTrigger>
            {index < tabContent.length - 1 && (
              <div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
            )}
          </React.Fragment>
        ))}
      </TabsList>

      <DottedSeparator />

      {tabContent.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <CampeoesTable
            columns={columns}
            data={championshipMap[tab.name] ?? []}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function CampeoesTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="flex flex-col">
      <div className="relative p-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="border-b-0" key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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

      <div className="flex items-center justify-end space-x-2 p-4">
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="sm"
          variant="outline"
        >
          Anterior
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="sm"
          variant="outline"
        >
          Próxima
        </Button>
      </div>
    </div>
  )
}
