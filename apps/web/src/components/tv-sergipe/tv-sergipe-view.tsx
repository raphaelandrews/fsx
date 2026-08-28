import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Medal01Icon,
  MedalFirstPlaceIcon,
  MedalSecondPlaceIcon,
  MedalThirdPlaceIcon,
} from "@hugeicons/core-free-icons";

import type { AppRouter } from "@fsx/api/routers/index";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Badge } from "@fsx/ui/components/badge";
import { Button } from "@fsx/ui/components/button";
import { EmptyTableRow } from "@/components/data-table/empty-table-row";
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

import { getGradient } from "@/lib/gradients";
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
  subScopeToFilters,
  type AgeGroup,
  type Modality,
  type Sex,
  type SubScopeId,
} from "./constants";

type LeaderboardRow = inferRouterOutputs<AppRouter>["tvSergipe"]["leaderboard"][number];
type SchoolResult = inferRouterOutputs<AppRouter>["tvSergipe"]["list"][number];

const AGE_SELECT_OPTIONS: { id: string; label: string }[] = [
  { id: "geral", label: "Geral" },
  ...AGE_GROUPS.map((age) => ({ id: age, label: AGE_LABEL[age] })),
];

// Base UI needs an `items` prop so `SelectValue` renders the label instead of the
// raw value (e.g. `male-individual`) on the trigger.
const AGE_SELECT_ITEMS = AGE_SELECT_OPTIONS.map((o) => ({ value: o.id, label: o.label }));
const SUB_SCOPE_ITEMS = SUB_SCOPE_TABS.map((s) => ({ value: s.id, label: s.label }));

export function TvSergipeView() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_public/tv-sergipe" });

  const filters = search.idade ? subScopeToFilters((search.escopo ?? "geral") as SubScopeId) : {};

  const { data: leaderboard = [] } = useSuspenseQuery(
    trpc.tvSergipe.leaderboard.queryOptions({
      ageGroup: search.idade,
      sex: filters.sex,
      modality: filters.modality,
    }),
  );
  const { data: allResults = [] } = useSuspenseQuery(trpc.tvSergipe.list.queryOptions());

  const selectedEscola = search.escola ?? null;
  const selectedSchool = useMemo(
    () =>
      leaderboard.find((row) => row.clubId === selectedEscola) ??
      allResults.find((r) => r.club.id === selectedEscola)?.club ??
      null,
    [leaderboard, allResults, selectedEscola],
  );

  // Medal view: client-side sort by gold→silver→bronze (server returns points desc).
  const orderedRows = useMemo(() => {
    if (search.view !== "medals") return leaderboard;
    return [...leaderboard].sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      return b.points - a.points;
    });
  }, [leaderboard, search.view]);

  // Drilldown data: filter cached list by current scope + selected club.
  const clubResults = useMemo(() => {
    if (selectedEscola === null) return [];
    return allResults.filter((r) => {
      if (r.club.id !== selectedEscola) return false;
      if (search.idade && r.ageGroup !== search.idade) return false;
      if (filters.sex && r.sex !== filters.sex) return false;
      if (filters.modality && r.modality !== filters.modality) return false;
      return true;
    });
  }, [allResults, selectedEscola, search.idade, filters.sex, filters.modality]);

  const isMedalView = search.view === "medals";

  return (
    <>
      {/* Filters — age group + sub-scope (left), view toggle 'Medalhas / Pontos' (right) */}
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
                  // Reset to "Geral" sub-scope whenever the age changes.
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

      {/* Leaderboard table */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Escola</TableHead>
              {isMedalView ? (
                <>
                  <TableHead className="w-24 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <HugeiconsIcon
                        className="size-4 text-amber-500"
                        icon={MedalFirstPlaceIcon}
                        strokeWidth={2}
                      />
                      Ouro
                    </span>
                  </TableHead>
                  <TableHead className="w-24 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <HugeiconsIcon
                        className="size-4 text-zinc-400"
                        icon={MedalSecondPlaceIcon}
                        strokeWidth={2}
                      />
                      Prata
                    </span>
                  </TableHead>
                  <TableHead className="w-24 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <HugeiconsIcon
                        className="size-4 text-amber-700"
                        icon={MedalThirdPlaceIcon}
                        strokeWidth={2}
                      />
                      Bronze
                    </span>
                  </TableHead>
                </>
              ) : (
                <TableHead className="w-24 text-right">Pontos</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedRows.length === 0 ? (
              <EmptyTableRow colSpan={isMedalView ? 5 : 3} className="text-center">
                Nenhuma escola pontuou neste recorte.
              </EmptyTableRow>
            ) : (
              orderedRows.map((row, index) => (
                <LeaderboardRow
                  key={row.clubId}
                  onOpen={() =>
                    navigate({ to: "/tv-sergipe", search: { ...search, escola: row.clubId } })
                  }
                  position={index + 1}
                  row={row}
                  showMedals={isMedalView}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* School drilldown subview — follows the circuitos URL-driven pattern */}
      {selectedSchool && (
        <section className="mt-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">{selectedSchool.name}</h2>
              <p className="text-muted-foreground text-sm">
                Resultados neste recorte
                {search.idade ? ` — ${AGE_LABEL[search.idade]}` : " — Geral"}
                {filters.sex ? ` · ${SEX_LABEL[filters.sex]}` : ""}
                {filters.modality ? ` · ${MODALITY_LABEL[filters.modality]}` : ""}
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: "/tv-sergipe", search: { ...search, escola: undefined } })}
              variant="ghost"
            >
              Fechar
            </Button>
          </div>

          {clubResults.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum resultado neste recorte.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {clubResults.map((result) => (
                <ResultRow key={result.id} result={result} />
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

function LeaderboardRow({
  row,
  position,
  onOpen,
  showMedals,
}: {
  row: LeaderboardRow;
  position: number;
  onOpen: () => void;
  showMedals: boolean;
}) {
  const gradient = getGradient(row.clubId);
  const initials = row.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <TableRow>
      <TableCell className="text-muted-foreground tabular-nums">{position}º</TableCell>
      <TableCell>
        <Button
          aria-label={`Ver resultados de ${row.name}`}
          className="flex h-auto items-center gap-3 rounded-md p-0 hover:bg-transparent hover:underline dark:hover:bg-transparent"
          onClick={onOpen}
          variant="ghost"
        >
          <Avatar className="size-8 rounded-md">
            <AvatarImage alt={row.name} className="object-contain" src={row.logoUrl ?? undefined} />
            <AvatarFallback style={gradient}>
              {initials ? (
                <span className="font-bold text-foreground text-xs uppercase">{initials}</span>
              ) : null}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium whitespace-nowrap">{row.name}</span>
        </Button>
      </TableCell>
      {showMedals ? (
        <>
          <TableCell className="text-right font-semibold tabular-nums">{row.gold}</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">{row.silver}</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">{row.bronze}</TableCell>
        </>
      ) : (
        <TableCell className="text-right font-semibold tabular-nums">{row.points}</TableCell>
      )}
    </TableRow>
  );
}

function ResultRow({ result }: { result: SchoolResult }) {
  const place = result.place as 1 | 2 | 3;
  const medalLabel = MEDAL_LABEL[place];
  const medalCount = result.modality === "team" ? TEAM_MEDAL_WEIGHT : INDIVIDUAL_MEDAL_WEIGHT;

  const medalVariant = place === 1 ? "default" : place === 2 ? "secondary" : "outline";

  return (
    <li className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">
          {AGE_LABEL[result.ageGroup as AgeGroup]} · {SEX_LABEL[result.sex as Sex]} ·{" "}
          {MODALITY_LABEL[result.modality as Modality]}
        </span>
        <Badge variant={medalVariant}>
          {medalLabel}
          {medalCount > 1 ? ` ×${medalCount}` : ""}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-3 text-muted-foreground text-sm">
        <span>
          {result.modality === "team"
            ? (result.teamName ?? "Equipe")
            : (result.player?.name ?? "—")}
        </span>
        <span className="tabular-nums">
          {result.place}º · {result.points} pts
        </span>
      </div>
    </li>
  );
}
