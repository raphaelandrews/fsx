"use client";

import { XIcon } from "lucide-react";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { birthdays, clubs, locations, sexes, titles } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col md:flex-row flex-1 items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
        <Input
          placeholder="Procurar jogadores..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          {table.getColumn("locations") && (
            <DataTableFacetedFilter
              column={table.getColumn("locations")}
              title="Local"
              options={locations}
            />
          )}
          {table.getColumn("clubs") && (
            <DataTableFacetedFilter
              column={table.getColumn("clubs")}
              title="Clubes"
              options={clubs}
            />
          )}
          {table.getColumn("rapid") && (
            <DataTableFacetedFilter
              column={table.getColumn("rapid")}
              title="Título"
              options={titles}
            />
          )}
          {table.getColumn("blitz") && (
            <DataTableFacetedFilter
              column={table.getColumn("blitz")}
              title="Categoria"
              options={sexes}
            />
          )}
          {table.getColumn("id") && (
            <DataTableFacetedFilter
              column={table.getColumn("id")}
              title="Subcategorias"
              options={birthdays}
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
      {/*<DataTableViewOptions table={table} />*/}
    </div>
  );
}
