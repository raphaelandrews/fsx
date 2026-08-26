import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { EmptyTableRow } from "@/components/data-table/empty-table-row"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fsx/ui/components/tabs"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { championColumns, type ChampionTournament } from "./columns"

const tabContent = [
  { value: "classic", name: "Absoluto" },
  { value: "rapid", name: "Rápido" },
  { value: "blitz", name: "Blitz" },
  { value: "female", name: "Feminino" },
  { value: "bullet", name: "Bullet" },
  { value: "team", name: "Equipes" },
]

export function ChampionsTabs({
  championshipMap,
}: {
  championshipMap: Record<string, ChampionTournament[]>
}) {
  return (
    <Tabs defaultValue="classic" className="w-full gap-0">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          {tabContent.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabContent.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <CampeoesTable data={championshipMap[tab.name] ?? []} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function CampeoesTable({ data }: { data: ChampionTournament[] }) {
  const table = useReactTable({
    data,
    columns: championColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="flex flex-col">
      <div className="p-4">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                <EmptyTableRow colSpan={championColumns.length}>
                  Sem resultados.
                </EmptyTableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="p-4">
        <DataTablePagination table={table} pageSizeOptions={[10, 20, 30, 40, 50]} />
      </div>
    </div>
  )
}
