import { Link } from "@tanstack/react-router";
import type { Table } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { SearchInput } from "./search-input";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  /** Column key to filter by typing in the search field, e.g. "name". */
  searchKey?: string;
  searchPlaceholder?: string;
  /** When provided, renders a "Create" link button. */
  createTo?: string;
  createLabel?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Buscar...",
  createTo,
  createLabel = "Novo",
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
        {searchKey ? (
          <SearchInput
            placeholder={searchPlaceholder}
            widthClass="w-full sm:w-[250px]"
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
          />
        ) : null}
        {isFiltered ? (
          <Button onClick={() => table.resetColumnFilters()} variant="outline">
            Limpar
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {createTo ? (
          <Link to={createTo}>
            <Button>{createLabel}</Button>
          </Link>
        ) : null}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
