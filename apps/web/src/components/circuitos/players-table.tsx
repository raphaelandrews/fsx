import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { EmptyTableRow } from "@/components/data-table/empty-table-row";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";

import { buildPlayerColumns } from "./columns";
import type { PlayerRow } from "./types";

export function PlayersTable({
  rows,
  phases,
  showCategory = false,
}: {
  rows: PlayerRow[];
  phases: string[];
  showCategory?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "total", desc: true }]);

  const columns = useMemo(
    () => buildPlayerColumns(phases, { showCategory }),
    [phases, showCategory],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 20 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={header.column.columnDef.meta?.className}
                    colSpan={header.colSpan}
                    key={header.id}
                  >
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
                    <TableCell className={cell.column.columnDef.meta?.className} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <EmptyTableRow colSpan={columns.length}>Sem resultados.</EmptyTableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4">
        <DataTablePagination table={table} pageSizeOptions={[10, 20, 30, 40, 50]} />
      </div>
    </div>
  );
}
