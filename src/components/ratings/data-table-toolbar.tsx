import React from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Table } from "@tanstack/react-table";
import { XIcon } from "lucide-react";

import { birthdays, clubs, locations, sexes, titles } from "./data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const search = useSearch({ from: "/_default/ratings/" }); // Updated path
  const navigate = useNavigate();

  const [inputValue, setInputValue] = React.useState(
    search.name?.toString() || ""
  );

  // Use debounce for search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      navigate({
        to: "/ratings",
        search: (prev) => ({
          ...prev,
          name: inputValue || undefined,
          page: 1,
        }),
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, navigate]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col md:flex-row flex-1 items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
        <Input
          placeholder="Procurar jogadores..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <DataTableFacetedFilter
            title="Local"
            options={locations}
            value={(search.locations as string[]) || []}
            onChange={(value) => {
              navigate({
                to: "/ratings",
                search: (prev) => ({
                  ...prev,
                  locations: value.length > 0 ? value : undefined,
                  page: 1,
                }),
              });
            }}
          />
          <DataTableFacetedFilter
            title="Clubes"
            options={clubs}
            value={(search.clubs as string[]) || []}
            onChange={(value) => {
              navigate({
                to: "/ratings",
                search: (prev) => ({
                  ...prev,
                  clubs: value.length > 0 ? value : undefined,
                  page: 1,
                }),
              });
            }}
          />
          <DataTableFacetedFilter
            title="Títulos"
            options={titles}
            value={(search.titles as string[]) || []}
            onChange={(value) => {
              navigate({
                to: "/ratings",
                search: (prev) => ({
                  ...prev,
                  titles: value.length > 0 ? value : undefined,
                  page: 1,
                }),
              });
            }}
          />
          <DataTableFacetedFilter
            title="Categoria"
            options={sexes}
            value={
              search.sex === undefined
                ? []
                : [
                    sexes.find((s) => s.value === String(search.sex))?.value ||
                      "",
                  ]
            }
            onChange={(value) => {
              navigate({
                to: "/ratings",
                search: (prev) => ({
                  ...prev,
                  sex: value[0] ? value[0] === "true" : undefined,
                  page: 1,
                }),
              });
            }}
          />
          <DataTableFacetedFilter
            title="Grupo"
            options={birthdays}
            value={(search.groups as string[]) || []}
            onChange={(value) => {
              navigate({
                to: "/ratings",
                search: (prev) => ({
                  ...prev,
                  groups: value.length > 0 ? value : undefined,
                  page: 1,
                }),
              });
            }}
          />
          {Boolean(
            search.locations?.length ||
              search.clubs?.length ||
              search.titles?.length ||
              search.sex ||
              search.groups?.length ||
              inputValue
          ) && (
            <Button
              variant="ghost"
              onClick={() => {
                navigate({
                  to: "/ratings",
                  search: {
                    page: 1,
                    limit: search.limit,
                    sortBy: search.sortBy,
                  },
                });
              }}
              className="h-8 px-2 lg:px-3"
            >
              Limpar
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
