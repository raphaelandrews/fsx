import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@fsx/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fsx/ui/components/tabs"

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
      <TabsList className="grid h-auto w-full grid-cols-3 gap-0 rounded-none bg-transparent p-0 md:grid-cols-6">
        {tabContent.map((tab) => (
          <div
            key={tab.value}
            className="relative flex items-center justify-center"
          >
            <TabsTrigger
              className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
              value={tab.value}
            >
              {tab.name}
            </TabsTrigger>
          </div>
        ))}
      </TabsList>

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
      <div className="relative p-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="border-b-0" key={headerGroup.id}>
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
                <TableCell className="h-24 text-center" colSpan={championColumns.length}>
                  Sem resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
