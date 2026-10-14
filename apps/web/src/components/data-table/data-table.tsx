import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Table as TanStackTable,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";

import { Checkbox } from "@fsx/ui/components/checkbox";

import { useTableText } from "@/hooks/use-table-text";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Rendered above the table; receives the table instance. */
  toolbar?: (table: TanStackTable<TData>) => ReactNode;
  /** Rendered below the table; receives the table instance. */
  pagination?: (table: TanStackTable<TData>) => ReactNode;
  /** Shown when the collection itself is empty, as opposed to filtered to nothing. */
  emptyState?: ReactNode;
  /** False when the server already returns a single page (e.g. players). */
  clientPagination?: boolean;
  pageSize?: number;
  /**
   * Adds a selection column; rendered above the table while rows are selected. Selection is of the rows on
   * screen only and resets when the data changes (another page, a refetch after the action).
   */
  bulkActions?: (selected: TData[], clear: () => void) => ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  pagination,
  emptyState,
  clientPagination = true,
  pageSize,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const text = useTableText();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => setRowSelection({}), [data]);

  const allColumns = useMemo<ColumnDef<TData, TValue>[]>(
    () =>
      bulkActions
        ? [
            {
              id: "select",
              header: ({ table: current }) => (
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={current.getIsAllPageRowsSelected()}
                  indeterminate={current.getIsSomePageRowsSelected()}
                  onCheckedChange={(checked) => current.toggleAllPageRowsSelected(checked === true)}
                />
              ),
              cell: ({ row }) => (
                <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(checked === true)} />
              ),
              meta: { className: "w-10" },
            },
            ...columns,
          ]
        : columns,
    [bulkActions, columns],
  );

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, columnVisibility, rowSelection, columnFilters },
    ...(pageSize ? { initialState: { pagination: { pageSize } } } : {}),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(clientPagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  if (data.length === 0 && emptyState && typeof emptyState !== "string") {
    return (
      <div className="space-y-4">
        {toolbar?.(table)}
        {emptyState}
      </div>
    );
  }

  const selected = bulkActions ? table.getSelectedRowModel().rows.map((row) => row.original) : [];

  return (
    <div className="space-y-4">
      {toolbar?.(table)}
      {bulkActions && selected.length > 0 ? (
        <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium tabular-nums">{selected.length} selected</span>
          {bulkActions(selected, () => setRowSelection({}))}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className={header.column.columnDef.meta?.className} key={header.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className={cell.column.columnDef.meta?.className} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-muted-foreground"
                  colSpan={allColumns.length}
                >
                  {data.length === 0 && emptyState ? emptyState : text.noMatches}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination?.(table)}
    </div>
  );
}
