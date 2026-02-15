"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { InfoIcon, XIcon } from "lucide-react"
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type { Players } from "@/db/queries"
import {
  columnsBlitz,
  columnsClassic,
  columnsRapid,
} from "@/app/(app)/(default)/ratings/components/columns"
import { DataTableFacetedFilter } from "@/app/(app)/(default)/ratings/components/data-table-faceted-filter"
import { DataTablePagination } from "@/app/(app)/(default)/ratings/components/data-table-pagination"
import { DataTableSkeletonRow } from "@/app/(app)/(default)/ratings/components/data-table-skeleton"
import {
  birthdays,
  sexes,
  titles,
} from "@/app/(app)/(default)/ratings/components/data/data"
import { DottedSeparator } from "@/components/dotted-separator"
import { RatingUpdateTooltip } from "@/components/rating-update-tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FilterOption = {
  value: string
  label: string
}

interface RatingsTablesProps {
  initialPlayers?: Players[]
  initialPagination?: {
    totalPages: number
  }
  clubs: FilterOption[]
  locations: FilterOption[]
}

export function Client({
  initialPlayers = [],
  initialPagination = { totalPages: 0 },
  clubs,
  locations,
}: RatingsTablesProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // State
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Data
  const [players, setPlayers] = React.useState(initialPlayers)
  const [pagination, setPagination] = React.useState(initialPagination)

  const defaultTab = searchParams.get("sortBy") || "rapid"
  const currentLimit = Number(searchParams.get("limit")) || 20

  // Filter input state
  const [inputValue, setInputValue] = React.useState(
    searchParams.get("name") || "",
  )
  const [debouncedValue, setDebouncedValue] = React.useState(inputValue)

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [inputValue])

  // Update URL on search change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Not
  React.useEffect(() => {
    updateSearchParams({ name: debouncedValue || undefined })
  }, [debouncedValue])

  // Fetch players effect
  React.useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true)
      const params = new URLSearchParams(searchParams.toString())

      params.set("page", searchParams.get("page") || "1")
      params.set("limit", currentLimit.toString())
      params.set("sortBy", searchParams.get("sortBy") || "rapid")
      params.set("sex", searchParams.get("sex") || "")

      // biome-ignore lint/complexity/noForEach: <explanation>
      searchParams.getAll("title").forEach((title) => {
        params.append("title", title)
      })

      // biome-ignore lint/complexity/noForEach: <explanation>
      searchParams.getAll("club").forEach((club) => {
        params.append("club", club)
      })

      // biome-ignore lint/complexity/noForEach: <explanation>
      searchParams.getAll("group").forEach((group) => {
        params.append("group", group)
      })

      // biome-ignore lint/complexity/noForEach: <explanation>
      searchParams.getAll("location").forEach((location) => {
        params.append("location", location)
      })

      const response = await fetch(`/api/players?${params.toString()}`)
      const data = await response.json()
      setPlayers(data.data.players || [])
      setPagination(data.data.pagination || { totalPages: 0 })
      setIsLoading(false)
    }

    fetchPlayers()
  }, [searchParams, currentLimit])

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    params.set("page", "1") // Reset to page 1 on tab change
    router.push(`${pathname}?${params.toString()}`)
  }

  const updateSearchParams = (
    params: Record<string, string | string[] | undefined>,
  ) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        newSearchParams.delete(key)
        for (const v of value) {
          newSearchParams.append(key, v)
        }
      } else if (value === undefined) {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value)
      }
    }

    if (!newSearchParams.has("limit")) {
      newSearchParams.set("limit", "20")
    }
    if (!newSearchParams.has("sortBy")) {
      newSearchParams.set("sortBy", "rapid")
    }
    router.push(`${pathname}?${newSearchParams.toString()}`)
  }

  const columns = React.useMemo(() => {
    switch (defaultTab) {
      case "classic":
        return columnsClassic
      case "blitz":
        return columnsBlitz
      case "rapid":
      default:
        return columnsRapid
    }
  }, [defaultTab])

  const table = useReactTable({
    data: players,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageSize: currentLimit,
        pageIndex: Number(searchParams.get("page")) - 1 || 0,
      },
    },
    manualPagination: true,
    pageCount: pagination.totalPages,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <Tabs
        defaultValue={defaultTab}
        onValueChange={onTabChange}
        className="w-full"
      >
        <TabsList className="h-auto w-full rounded-none bg-transparent p-0">
          <TabsTrigger
            className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
            value="classic"
          >
            Clássico
          </TabsTrigger>
          <div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
          <TabsTrigger
            className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
            value="rapid"
          >
            Rápido
          </TabsTrigger>
          <div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
          <TabsTrigger
            className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
            value="blitz"
          >
            Blitz
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DottedSeparator />

      {/* Info & Tooltip */}
      <div className="p-4 flex items-center gap-4">
        <RatingUpdateTooltip />
        <Info />
      </div>

      <DottedSeparator />

      {/* Search */}
      <div className="p-4">
        <Input
          className="h-8 max-w-sm border-dashed bg-background focus-visible:border-solid dark:bg-input/30"
          onChange={(event) => {
            setInputValue(event.target.value)
          }}
          placeholder="Procurar jogadores..."
          value={inputValue}
        />
      </div>

      <DottedSeparator />

      {/* Filters */}
      <div className="p-4 flex flex-wrap gap-2 items-center">
        <DataTableFacetedFilter
          onChange={(value) => {
            updateSearchParams({
              location: value.length > 0 ? value : undefined,
            })
          }}
          options={locations}
          title="Local"
          value={searchParams.getAll("location")}
        />
        <DataTableFacetedFilter
          onChange={(value) => {
            updateSearchParams({
              club: value.length > 0 ? value : undefined,
            })
          }}
          options={clubs}
          title="Clubes"
          value={searchParams.getAll("club")}
        />
        <DataTableFacetedFilter
          onChange={(value) => {
            updateSearchParams({
              title: value.length > 0 ? value : undefined,
            })
          }}
          options={titles}
          title="Títulos"
          value={searchParams.getAll("title")}
        />
        <DataTableFacetedFilter
          onChange={(value) => {
            updateSearchParams({ sex: value[0] || undefined })
          }}
          options={sexes}
          title="Categoria"
          value={
            searchParams.get("sex") === null
              ? []
              : [searchParams.get("sex") || ""]
          }
        />
        <DataTableFacetedFilter
          onChange={(value) => {
            updateSearchParams({
              group: value.length > 0 ? value : undefined,
            })
          }}
          options={birthdays}
          title="Grupo"
          value={searchParams.getAll("group")}
        />
        {Boolean(
          searchParams.getAll("location").length ||
          searchParams.getAll("club").length ||
          searchParams.getAll("title").length ||
          searchParams.get("sex") ||
          searchParams.getAll("group").length ||
          inputValue,
        ) && (
            <Button
              className="h-8 px-2 lg:px-3"
              onClick={() => {
                setInputValue("")
                router.push(
                  `/ratings?page=1&limit=${searchParams.get(
                    "limit",
                  )}&sortBy=${searchParams.get("sortBy")}`,
                )
              }}
              variant="ghost"
            >
              Limpar
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
      </div>

      <DottedSeparator />

      {/* Table */}
      <div className="relative p-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header) => (
                  <TableHead colSpan={header.colSpan} key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <DataTableSkeletonRow
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={`skeleton-row-${index}`}
                />
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  Sem resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DottedSeparator />

      {/* Pagination */}
      <div className="p-4">
        <DataTablePagination table={table} totalPages={pagination.totalPages} />
      </div>
    </div>
  )
}

function Info() {
  return (
    <div className="flex items-center gap-5">
      <Popover>
        <PopoverTrigger asChild>
          <Button className="h-8 w-8 rounded-full p-0" variant="dashed">
            <InfoIcon className="h-4 w-4 text-primary" />
            <span className="sr-only">Open popover</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex items-start justify-start gap-2 text-sm">
            <InfoIcon className="h-4 w-4 min-w-[1rem] rounded text-primary" />
            <div className="flex flex-col gap-2">
              <p>
                Na tabela de rating constam apenas os jogadores ativos na FSX.
              </p>
              <p>
                É considerado jogador ativo o enxadrista que participou de ao
                menos um torneio nos últimos três anos.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
