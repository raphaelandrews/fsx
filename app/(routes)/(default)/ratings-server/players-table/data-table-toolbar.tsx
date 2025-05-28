"use client";

import React from "react"; 
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Table } from "@tanstack/react-table";
import { XIcon } from "lucide-react";

import { birthdays, clubs, locations, sexes, titles } from "./data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [inputValue, setInputValue] = React.useState(searchParams.get("name") || "");
  const [debouncedValue, setDebouncedValue] = React.useState(inputValue); 

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  React.useEffect(() => {
    updateSearchParams({ name: debouncedValue || undefined });
  }, [debouncedValue]); 

  const updateSearchParams = (
    params: Record<string, string | string[] | undefined>
  ) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        newSearchParams.delete(key);
        for (const v of value) {
          newSearchParams.append(key, v);
        }
      } else if (value === undefined) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    }

    if (!newSearchParams.has("limit")) {
      newSearchParams.set("limit", "20");
    }
    if (!newSearchParams.has("sortBy")) {
      newSearchParams.set("sortBy", "rapid");
    }
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col md:flex-row flex-1 items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
        <Input
          placeholder="Procurar jogadores..."
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <DataTableFacetedFilter
            title="Local"
            options={locations}
            value={searchParams.getAll("location")}
            onChange={(value) => {
              updateSearchParams({
                location: value.length > 0 ? value : undefined,
              });
            }}
          />
          <DataTableFacetedFilter
            title="Clubes"
            options={clubs}
            value={searchParams.getAll("club")}
            onChange={(value) => {
              updateSearchParams({
                club: value.length > 0 ? value : undefined,
              });
            }}
          />
          <DataTableFacetedFilter
            title="Títulos"
            options={titles}
            value={searchParams.getAll("title")}
            onChange={(value) => {
              updateSearchParams({
                title: value.length > 0 ? value : undefined,
              });
            }}
          />
          <DataTableFacetedFilter
            title="Categoria"
            options={sexes}
            value={
              searchParams.get("sex") === null
                ? []
                : [searchParams.get("sex") || ""]
            }
            onChange={(value) => {
              updateSearchParams({ sex: value[0] || undefined });
            }}
          />
          <DataTableFacetedFilter
            title="Grupo"
            options={birthdays}
            value={searchParams.getAll("group")}
            onChange={(value) => {
              updateSearchParams({
                group: value.length > 0 ? value : undefined,
              });
            }}
          />
          {Boolean(
            searchParams.getAll("location").length ||
              searchParams.getAll("club").length ||
              searchParams.getAll("title").length ||
              searchParams.get("sex") ||
              searchParams.getAll("group").length ||
              inputValue 
          ) && (
            <Button
              variant="ghost"
              onClick={() => {
                setInputValue("");
                router.push(`/ratings?page=1&limit=${searchParams.get(
                  "limit"
                )}&sortBy=${searchParams.get("sortBy")}`); 
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
