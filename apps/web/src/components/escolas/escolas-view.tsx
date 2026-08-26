import { useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fsx/ui/components/dialog";
import { EmptyTableRow } from "@/components/data-table/empty-table-row";
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

type LeaderboardRow = inferRouterOutputs<AppRouter>["schoolResults"]["leaderboard"][number];
type SchoolResult = inferRouterOutputs<AppRouter>["schoolResults"]["list"][number];

export function EscolasView() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_public/escolas" });

  const filters = search.idade ? subScopeToFilters((search.escopo ?? "geral") as SubScopeId) : {};

  const { data: leaderboard = [] } = useSuspenseQuery(
    trpc.schoolResults.leaderboard.queryOptions({
      ageGroup: search.idade,
      sex: filters.sex,
      modality: filters.modality,
    }),
  );
  const { data: allResults = [] } = useSuspenseQuery(trpc.schoolResults.list.queryOptions());

  const [openClubId, setOpenClubId] = useState<number | null>(null);
  const openClub = useMemo(
    () => leaderboard.find((row) => row.clubId === openClubId) ?? null,
    [leaderboard, openClubId],
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
    if (openClubId === null) return [];
    return allResults.filter((r) => {
      if (r.clubId !== openClubId) return false;
      if (search.idade && r.ageGroup !== search.idade) return false;
      if (filters.sex && r.sex !== filters.sex) return false;
      if (filters.modality && r.modality !== filters.modality) return false;
      return true;
    });
  }, [allResults, openClubId, search.idade, filters.sex, filters.modality]);

  const isMedalView = search.view === "medals";

  return (
    <>
      {/* Primary scope — Geral + 6 age groups */}
      <Tabs
        className="mb-4 w-full"
        onValueChange={(value) =>
          navigate({
            to: "/escolas",
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
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            {AGE_GROUPS.map((age) => (
              <TabsTrigger key={age} value={age}>
                {AGE_LABEL[age]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Secondary scope — only when an age is selected */}
      {search.idade ? (
        <Tabs
          className="mb-6 w-full"
          onValueChange={(value) =>
            navigate({
              to: "/escolas",
              search: { ...search, escopo: value as SubScopeId },
            })
          }
          value={(search.escopo as SubScopeId) ?? "geral"}
        >
          <div className="flex w-full justify-center overflow-x-auto">
            <TabsList className="overflow-x-auto">
              {SUB_SCOPE_TABS.map((scope) => (
                <TabsTrigger key={scope.id} value={scope.id}>
                  {scope.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      ) : (
        <div className="mb-6" />
      )}

      {/* View toggle — Medalhas / Pontos */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {orderedRows.length} {orderedRows.length === 1 ? "escola" : "escolas"}
        </p>
        <Tabs
          className="w-fit"
          onValueChange={(value) =>
            navigate({
              to: "/escolas",
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

      <Dialog
        open={openClubId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenClubId(null);
        }}
      >
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
                    onOpen={() => setOpenClubId(row.clubId)}
                    position={index + 1}
                    row={row}
                    showMedals={isMedalView}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Drilldown dialog — opens when a school's row is clicked */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openClub?.name ?? "Escola"}</DialogTitle>
            <DialogDescription>
              Resultados neste recorte
              {search.idade ? ` — ${AGE_LABEL[search.idade]}` : " — Geral"}
              {filters.sex ? ` · ${SEX_LABEL[filters.sex]}` : ""}
              {filters.modality ? ` · ${MODALITY_LABEL[filters.modality]}` : ""}
            </DialogDescription>
          </DialogHeader>

          {clubResults.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum resultado neste recorte.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-md border">
              {clubResults.map((result) => (
                <ResultRow key={result.id} result={result} />
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
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
        <DialogTrigger
          onClick={onOpen}
          render={
            <Button
              aria-label={`Ver resultados de ${row.name}`}
              className="flex h-auto items-center gap-3 rounded-md p-0 hover:bg-transparent hover:underline dark:hover:bg-transparent aria-expanded:bg-transparent"
              variant="ghost"
            />
          }
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
        </DialogTrigger>
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
