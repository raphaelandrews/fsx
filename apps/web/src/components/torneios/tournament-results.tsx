import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

type Result = inferRouterOutputs<AppRouter>["tournaments"]["results"][number];

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

const columns: ColumnDef<Result>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jogador" />,
    cell: ({ row }) => (
      <Link to="/jogadores/$id" params={{ id: row.original.playerId }} className="link-inline font-medium">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "oldRating",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Antes" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.oldRating}</span>,
  },
  {
    accessorKey: "variation",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Variação" />,
    cell: ({ row }) => (
      <span className={`font-semibold tabular-nums ${row.original.variation >= 0 ? "text-success" : "text-destructive"}`}>
        {signed(row.original.variation)}
      </span>
    ),
  },
  {
    id: "after",
    accessorFn: (row) => row.oldRating + row.variation,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Depois" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.oldRating + row.original.variation}</span>,
  },
];

export function TournamentResults({ results }: { results: Result[] }) {
  return (
    <DataTable
      columns={columns}
      data={results}
      pageSize={20}
      pagination={(table) => <DataTablePagination table={table} />}
    />
  );
}
