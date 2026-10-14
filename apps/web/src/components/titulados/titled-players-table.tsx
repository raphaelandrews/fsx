import type { Column, Table } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { SearchInput } from "@/components/data-table/search-input";
import { titledPlayersColumns, type TitledPlayer } from "./columns";
import { externalTitles, internalTitles } from "./data";

function TitleFilter({
  column,
  title,
  options,
}: {
  column: Column<TitledPlayer> | undefined;
  title: string;
  options: { label: string; value: string }[];
}) {
  if (!column) return null;
  const value = (column.getFilterValue() as string[] | undefined) ?? [];
  return (
    <DataTableFacetedFilter
      counts={column.getFacetedUniqueValues()}
      onChange={(next) => column.setFilterValue(next.length ? next : undefined)}
      options={options}
      title={title}
      value={value}
    />
  );
}

function TitledPlayersToolbar({ table }: { table: Table<TitledPlayer> }) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchInput
        onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
        placeholder="Procurar jogadores..."
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        widthClass="w-full sm:w-[250px]"
      />
      <TitleFilter column={table.getColumn("internalTitle")} options={internalTitles} title="FSX" />
      <TitleFilter
        column={table.getColumn("externalTitle")}
        options={externalTitles}
        title="CBX/FIDE"
      />
      {isFiltered && (
        <Button
          className="h-8 px-2 lg:px-3"
          onClick={() => table.resetColumnFilters()}
          variant="ghost"
        >
          Limpar
          <HugeiconsIcon className="ml-2 size-4" icon={Cancel01Icon} />
        </Button>
      )}
    </div>
  )
}

export function TitledPlayersTable({ data }: { data: TitledPlayer[] }) {
  return (
    <DataTable
      columns={titledPlayersColumns}
      data={data}
      pageSize={20}
      toolbar={(table) => <TitledPlayersToolbar table={table} />}
      pagination={(table) => (
        <div className="p-4 pt-0">
          <DataTablePagination table={table} pageSizeOptions={[10, 20, 30, 40, 50]} />
        </div>
      )}
    />
  );
}
