import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Medal01Icon,
  MedalFirstPlaceIcon,
  MedalSecondPlaceIcon,
  MedalThirdPlaceIcon,
} from "@hugeicons/core-free-icons";
import {
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  type Row,
  useReactTable,
} from "@tanstack/react-table";

import type { AppRouter } from "@fsx/api/routers/index";

import { Badge } from "@fsx/ui/components/badge";
import { Button } from "@fsx/ui/components/button";
import { EmptyTableRow } from "@/components/data-table/empty-table-row";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { getInitials } from "@/lib/initials";
import { useTRPC } from "@/utils/trpc";
import {
  AGE_GROUPS,
  AGE_LABEL,
  INDIVIDUAL_MEDAL_WEIGHT,
  MEDAL_LABEL,
  MODALITY_LABEL,
  SEX_LABEL,
  SUB_SCOPE_TABS,
  TEAM_MEDAL_WEIGHT,
  type AgeGroup,
  type Modality,
  type Sex,
  type SubScopeId,
} from "./constants";
import {
  resolveTvSergipeFilters,
  tvSergipeLeaderboardOptions,
  tvSergipeListOptions,
} from "./queries";

type LeaderboardRow = inferRouterOutputs<AppRouter>["tvSergipe"]["leaderboard"][number];
type SchoolResult = inferRouterOutputs<AppRouter>["tvSergipe"]["list"][number];
type ResultScope = "todos" | "individual" | "team";

const AGE_SELECT_OPTIONS: { id: string; label: string }[] = [
  { id: "geral", label: "Geral" },
  ...AGE_GROUPS.map((age) => ({ id: age, label: AGE_LABEL[age] })),
];

const AGE_SELECT_ITEMS = AGE_SELECT_OPTIONS.map((o) => ({ value: o.id, label: o.label }));
const SUB_SCOPE_ITEMS = SUB_SCOPE_TABS.map((s) => ({ value: s.id, label: s.label }));

export function TvSergipeView() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_public/tv-sergipe" });

  const filters = resolveTvSergipeFilters({ idade: search.idade, escopo: search.escopo });

  const { data: leaderboard = [] } = useSuspenseQuery(
    tvSergipeLeaderboardOptions(trpc, filters),
  );
  const { data: allResults = [] } = useSuspenseQuery(tvSergipeListOptions(trpc));

  const orderedRows = useMemo(() => {
    if (search.view === "medals") {
      return [...leaderboard].sort((a, b) => {
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        if (b.bronze !== a.bronze) return b.bronze - a.bronze;
        return b.points - a.points;
      });
    }
    // Points view: strictly descending by total points.
    return [...leaderboard].sort((a, b) => b.points - a.points);
  }, [leaderboard, search.view]);

  const isMedalView = search.view === "medals";

  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [resultScope, setResultScope] = useState<ResultScope>("todos");

  // Applies the current age/sex/modality scope + the row's school.
  const resultsForClub = (clubId: number, scope: ResultScope) =>
    allResults
      .filter((r) => {
        if (r.club.id !== clubId) return false;
        if (search.idade && r.ageGroup !== search.idade) return false;
        if (filters.sex && r.sex !== filters.sex) return false;
        if (filters.modality && r.modality !== filters.modality) return false;
        if (scope !== "todos" && r.modality !== scope) return false;
        return true;
      })
      .sort((a, b) => b.points - a.points);

  const table = useReactTable({
    data: orderedRows,
    columns: [
      {
        id: "expander",
        header: () => <span className="sr-only">Expandir</span>,
        cell: ({ row }: { row: Row<LeaderboardRow> }) =>
          row.getCanExpand() ? (
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
          ),
      },
      { id: "position", header: () => "#" },
      { id: "name", header: () => "Escola" },
      ...(isMedalView
        ? [
            { id: "gold", header: () => <MedalHead icon={MedalFirstPlaceIcon} label="Ouro" color="text-amber-500" />, meta: { className: "w-24" } },
            { id: "silver", header: () => <MedalHead icon={MedalSecondPlaceIcon} label="Prata" color="text-zinc-400" />, meta: { className: "w-24" } },
            { id: "bronze", header: () => <MedalHead icon={MedalThirdPlaceIcon} label="Bronze" color="text-amber-700" />, meta: { className: "w-24" } },
          ]
        : [{ id: "points", header: () => <span className="text-center">Pontos</span>, meta: { className: "w-24" } }]),
    ] as const,
    state: { expanded },
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            items={AGE_SELECT_ITEMS}
            onValueChange={(value) =>
              navigate({
                to: "/tv-sergipe",
                search: {
                  ...search,
                  idade: value === "geral" ? undefined : (value as AgeGroup),
                  escopo: undefined,
                },
              })
            }
            value={search.idade ?? "geral"}
          >
            <SelectTrigger className="min-w-48">
              <SelectValue placeholder="Faixa etária" />
            </SelectTrigger>
            <SelectContent>
              {AGE_SELECT_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {search.idade ? (
            <Select
              items={SUB_SCOPE_ITEMS}
              onValueChange={(value) =>
                navigate({
                  to: "/tv-sergipe",
                  search: { ...search, escopo: value as SubScopeId },
                })
              }
              value={(search.escopo as SubScopeId) ?? "geral"}
            >
              <SelectTrigger className="min-w-48">
                <SelectValue placeholder="Recorte" />
              </SelectTrigger>
              <SelectContent>
                {SUB_SCOPE_TABS.map((scope) => (
                  <SelectItem key={scope.id} value={scope.id}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <Tabs
          className="w-fit"
          onValueChange={(value) =>
            navigate({
              to: "/tv-sergipe",
              search: { ...search, view: value as "medals" | "points" },
            })
          }
          value={search.view}
        >
          <TabsList>
            <TabsTrigger value="medals">
              <HugeiconsIcon className="mr-1.5 size-4" icon={Medal01Icon} strokeWidth={2} />
              Medalhas
            </TabsTrigger>
            <TabsTrigger value="points">Pontos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className={
                        header.column.id === "expander"
                          ? "w-10"
                          : header.column.id === "position"
                            ? "w-10"
                            : header.column.id === "name"
                              ? "w-full"
                              : (header.column.columnDef.meta as { className?: string } | undefined)?.className
                      }
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <SchoolRows
                    key={row.id}
                    row={row}
                    position={row.index + 1}
                    resultScope={resultScope}
                    onSelectScope={setResultScope}
                    resultsForClub={resultsForClub}
                  />
                ))
              ) : (
                <EmptyTableRow colSpan={isMedalView ? 6 : 4} className="text-center">
                  Nenhuma escola pontuou neste recorte.
                </EmptyTableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4">
          <DataTablePagination table={table} pageSizeOptions={[10, 20, 30, 40, 50]} />
        </div>
      </div>
    </>
  );
}

function SchoolRows({
  row,
  position,
  resultScope,
  onSelectScope,
  resultsForClub,
}: {
  row: Row<LeaderboardRow>;
  position: number;
  resultScope: ResultScope;
  onSelectScope: (scope: ResultScope) => void;
  resultsForClub: (clubId: number, scope: ResultScope) => SchoolResult[];
}) {
  const school = row.original;

  return (
    <>
      <TableRow data-state={row.getIsExpanded() && "selected"}>
        {row.getVisibleCells().map((cell) => {
          if (cell.column.id === "expander") {
            return (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          }
          if (cell.column.id === "position") {
            return (
              <TableCell className="text-muted-foreground tabular-nums" key={cell.id}>
                {position}º
              </TableCell>
            );
          }
          if (cell.column.id === "name") {
            return (
              <TableCell key={cell.id}>
                <div className="flex items-center gap-3">
                  <span className="relative flex shrink-0 h-5 w-5 overflow-hidden rounded">
                    {school.logoUrl ? (
                      <img
                        alt={school.name}
                        className="aspect-square size-full object-contain"
                        src={school.logoUrl}
                      />
                    ) : (
                      <span className="flex aspect-square size-full items-center justify-center rounded bg-muted">
                        <span className="text-xs uppercase text-foreground">
                          {getInitials(school.name)}
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="font-medium whitespace-nowrap">{school.name}</span>
                </div>
              </TableCell>
            );
          }
          const value =
            cell.column.id === "gold"
              ? school.gold
              : cell.column.id === "silver"
                ? school.silver
                : cell.column.id === "bronze"
                  ? school.bronze
                  : school.points;
          return (
            <TableCell className="text-center font-semibold tabular-nums" key={cell.id}>
              {value}
            </TableCell>
          );
        })}
      </TableRow>
      {row.getIsExpanded() && (
        <TableRow className="hover:bg-transparent odd:bg-background even:bg-background">
          <TableCell className="bg-muted/30 p-0" colSpan={row.getVisibleCells().length + 1}>
            <SchoolDetail
              name={school.name}
              scope={resultScope}
              onSelectScope={onSelectScope}
              results={resultsForClub(school.clubId, resultScope)}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function SchoolDetail({
  name,
  scope,
  onSelectScope,
  results,
}: {
  name: string;
  scope: ResultScope;
  onSelectScope: (scope: ResultScope) => void;
  results: SchoolResult[];
}) {
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">{name}</p>
        <Tabs className="w-fit" onValueChange={(value) => onSelectScope(value as ResultScope)} value={scope}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="individual">Atletas</TabsTrigger>
            <TabsTrigger value="team">Equipes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {results.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum resultado neste recorte.</p>
      ) : (
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Categoria</TableHead>
                <TableHead className="text-left">Resultado</TableHead>
                <TableHead className="w-24 text-center">Lugar</TableHead>
                <TableHead className="w-24 text-center">Pontos</TableHead>
                <TableHead className="w-28 text-right">Medalha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <ResultRow key={result.id} result={result} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function MedalHead({ icon, label, color }: { icon: (typeof MedalFirstPlaceIcon); label: string; color: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <HugeiconsIcon className={`size-4 ${color}`} icon={icon} strokeWidth={2} />
      {label}
    </span>
  );
}

function ResultRow({ result }: { result: SchoolResult }) {
  const place = result.place as 1 | 2 | 3;
  const medalLabel = MEDAL_LABEL[place];
  const medalCount = result.modality === "team" ? TEAM_MEDAL_WEIGHT : INDIVIDUAL_MEDAL_WEIGHT;
  const medalVariant = place === 1 ? "default" : place === 2 ? "secondary" : "outline";

  return (
    <TableRow>
      <TableCell className="text-left text-sm">
        {AGE_LABEL[result.ageGroup as AgeGroup]} · {SEX_LABEL[result.sex as Sex]} ·{" "}
        {MODALITY_LABEL[result.modality as Modality]}
      </TableCell>
      <TableCell className="text-left text-sm font-medium">
        {result.modality === "team"
          ? `${result.club.name}${result.teamName ? ` ${result.teamName}` : ""}`
          : (result.player?.name ?? "—")}
      </TableCell>
      <TableCell className="text-center text-sm tabular-nums">{result.place}º</TableCell>
      <TableCell className="text-center text-sm tabular-nums">{result.points}</TableCell>
      <TableCell className="text-right">
        <Badge variant={medalVariant}>
          {medalLabel}
          {medalCount > 1 ? ` ×${medalCount}` : ""}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
