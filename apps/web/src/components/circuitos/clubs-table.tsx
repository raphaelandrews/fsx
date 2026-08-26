import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";
import { PlayerActions } from "@/components/campeoes/actions";
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

import { buildClubColumns } from "./columns";
import type { ClubRow, PlayerRow } from "./types";

export function ClubsTable({ rows, phases }: { rows: ClubRow[]; phases: string[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "total", desc: true }]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns = useMemo(() => buildClubColumns(phases), [phases]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => row.original.players.length > 0,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-10" />
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
              table
                .getRowModel()
                .rows.map((row) => <ClubRows key={row.id} phases={phases} row={row} />)
            ) : (
              <EmptyTableRow colSpan={columns.length + 1}>Sem resultados.</EmptyTableRow>
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

function ClubRows({ row, phases }: { row: Row<ClubRow>; phases: string[] }) {
  return (
    <>
      <TableRow data-state={row.getIsExpanded() && "selected"}>
        <TableCell className="w-10 p-0">
          {row.getCanExpand() ? (
            <Button
              aria-label={row.getIsExpanded() ? "Recolher" : "Expandir"}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={row.getToggleExpandedHandler()}
              size="icon-sm"
              variant="ghost"
            >
              <HugeiconsIcon
                className="size-4"
                icon={row.getIsExpanded() ? ArrowDown01Icon : ArrowRight01Icon}
                strokeWidth={2}
              />
            </Button>
          ) : (
            <span className="block h-8 w-8" />
          )}
        </TableCell>
        {row.getVisibleCells().map((cell) => (
          <TableCell className={cell.column.columnDef.meta?.className} key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      {row.getIsExpanded() && (
        <TableRow className="hover:bg-transparent odd:bg-background even:bg-background">
          <TableCell className="bg-muted/30 p-0" colSpan={row.getVisibleCells().length + 1}>
            <ClubPlayersDetail phases={phases} players={row.original.players} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ClubPlayersDetail({ players, phases }: { players: PlayerRow[]; phases: string[] }) {
  return (
    <div className="px-4 py-3 sm:px-10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-2 text-xs font-medium">Jogador</th>
            {phases.map((phase) => (
              <th className="px-2 py-2 text-right text-xs font-medium" key={phase}>
                {phase}
              </th>
            ))}
            <th className="py-2 pl-2 text-right text-xs font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr className="border-b last:border-0" key={player.id}>
              <td className="py-2 pr-2">
                <PlayerActions
                  id={player.id}
                  image={player.imageUrl}
                  name={player.name}
                  nickname={player.nickname}
                  shortTitle={player.playersToTitles?.find((t) => t.title)?.title.shortName ?? null}
                />
              </td>
              {phases.map((phase) => (
                <td className="px-2 py-2 text-right tabular-nums" key={phase}>
                  {player.pointsByPhase[phase] || <span className="text-muted-foreground">—</span>}
                </td>
              ))}
              <td className="py-2 pl-2 text-right font-semibold tabular-nums">{player.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
