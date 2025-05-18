"use client";

import { XIcon } from "lucide-react";
import type { Table } from "@tanstack/react-table";

import { categories } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Button } from "@/components/ui/button";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        {table.getColumn("category") && (
          <DataTableFacetedFilter
            column={table.getColumn("category")}
            title="Categoria"
            options={categories}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Limpar
            <XIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
