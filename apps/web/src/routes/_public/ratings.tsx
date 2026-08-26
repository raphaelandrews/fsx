import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Pagination } from "@/components/data-table/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";
import { Avatar, AvatarImage } from "@fsx/ui/components/avatar";
import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { SearchInput } from "@/components/data-table/search-input";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { PlayerActions } from "@/components/campeoes/actions";
import {
  ratingGroups,
  ratingSexes,
  ratingSortLabels,
  ratingTitles,
} from "@/components/ratings/data-options";
import { useTRPC } from "@/utils/trpc";

const sortByEnum = z.enum(["classic", "rapid", "blitz"]);
type SortBy = z.infer<typeof sortByEnum>;

const searchSchema = z.object({
  page: z.number().int().positive().default(1),
  ordenar: sortByEnum.default("rapid"),
  sexo: z.enum(["male", "female"]).optional(),
  nome: z.string().optional(),
  local: z.array(z.string()).default([]),
  clube: z.array(z.string()).default([]),
  titulo: z.array(z.string()).default([]),
  grupo: z.array(z.string()).default([]),
});

export const Route = createFileRoute("/_public/ratings")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Ratings - FSX" },
      { name: "description", content: "Ranking de ratings dos jogadores da FSX" },
    ],
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
    sortBy: search.ordenar,
    sex: search.sexo,
    name: search.nome,
    titles: search.titulo,
    clubs: search.clube,
    locations: search.local,
    groups: search.grupo,
  }),
  loader: async ({ context, deps }) => {
    // Prime the main data + lookup lists so the route renders with everything
    // in cache. The component re-uses the same keys via useSuspenseQuery.
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.players.withFilters.queryOptions({
          page: deps.page,
          sortBy: deps.sortBy,
          sex: deps.sex,
          name: deps.name,
          titles: deps.titles,
          clubs: deps.clubs,
          locations: deps.locations,
          groups: deps.groups,
        }),
      ),
      context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
    ]);
  },
  pendingComponent: () => <TableSkeleton cols={5} />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { data } = useSuspenseQuery(
    trpc.players.withFilters.queryOptions({
      page: search.page,
      sortBy: search.ordenar,
      sex: search.sexo,
      name: search.nome,
      titles: search.titulo,
      clubs: search.clube,
      locations: search.local,
      groups: search.grupo,
    }),
  );

  const { data: clubs = [] } = useSuspenseQuery(trpc.clubs.list.queryOptions());
  const { data: locations = [] } = useSuspenseQuery(trpc.locations.list.queryOptions());

  const [nameInput, setNameInput] = useState(search.nome ?? "");

  const updateSearch = (partial: Partial<typeof search>) => {
    navigate({ to: "/ratings", search: { ...search, ...partial, page: 1 } });
  };

  const clearFilters = () => {
    setNameInput("");
    navigate({
      to: "/ratings",
      search: {
        ...search,
        page: 1,
        sexo: undefined,
        nome: undefined,
        local: [],
        clube: [],
        titulo: [],
        grupo: [],
      },
    });
  };

  const isFiltered =
    Boolean(search.sexo) ||
    Boolean(search.nome) ||
    search.local.length > 0 ||
    search.clube.length > 0 ||
    search.titulo.length > 0 ||
    search.grupo.length > 0 ||
    nameInput.length > 0;

  const { players, pagination } = data;
  const ratingColumn = ratingSortLabels[search.ordenar];

  return (
    <>
      <PageHeader title="Ratings" />

      {/* Rating tabs — drive which rating column is rendered below */}
      <Tabs
        className="mb-4 w-full"
        onValueChange={(value) => updateSearch({ ordenar: value as SortBy })}
        value={search.ordenar}
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="classic">Clássico</TabsTrigger>
            <TabsTrigger value="rapid">Rápido</TabsTrigger>
            <TabsTrigger value="blitz">Blitz</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Faceted filters + search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <DataTableFacetedFilter
          options={locations.map((l) => ({
            label: l.name,
            value: l.name,
          }))}
          title="Local"
          value={search.local}
          onChange={(v) => updateSearch({ local: v })}
        />

        <DataTableFacetedFilter
          options={clubs.map((c) => ({
            label: c.name,
            value: c.name,
          }))}
          title="Clubes"
          value={search.clube}
          onChange={(v) => updateSearch({ clube: v })}
        />

        <DataTableFacetedFilter
          options={ratingTitles.map((t) => ({
            label: t.label,
            value: t.value,
          }))}
          title="Títulos"
          value={search.titulo}
          onChange={(v) => updateSearch({ titulo: v })}
        />

        <DataTableFacetedFilter
          options={ratingGroups.map((g) => ({
            label: g.label,
            value: g.value,
          }))}
          title="Grupo"
          value={search.grupo}
          onChange={(v) => updateSearch({ grupo: v })}
        />

        <DataTableFacetedFilter
          options={ratingSexes.map((s) => ({
            label: s.label,
            value: s.value,
          }))}
          singleSelect
          title="Categoria"
          value={search.sexo ? [search.sexo] : []}
          onChange={(v) =>
            updateSearch({
              sexo: (v[0] as typeof search.sexo | undefined) ?? undefined,
            })
          }
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ nome: nameInput.trim() || undefined });
          }}
        >
          <SearchInput
            placeholder="Nome do jogador..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </form>

        {isFiltered ? (
          <Button className="h-8 px-2 lg:px-3" onClick={clearFilters} variant="ghost">
            Limpar
            <HugeiconsIcon className="ml-2 size-4" icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        ) : null}
      </div>

      {/* Table — column order: # / Nome / [rating] / Local (flag) / Clube (logo) */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-center">{ratingColumn}</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Clube</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player, index) => (
              <TableRow key={player.id}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  <PlayerActions
                    id={player.id}
                    image={player.imageUrl}
                    name={player.name}
                    nickname={player.nickname}
                    shortTitle={player.playersToTitles?.[0]?.title.shortName ?? null}
                  />
                </TableCell>
                <TableCell className="text-center tabular-nums font-medium">
                  {player[search.ordenar]}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {player.location?.flagUrl ? (
                      <Avatar className="size-4 rounded object-contain">
                        <AvatarImage
                          alt={player.location.name ?? ""}
                          className="object-contain"
                          src={player.location.flagUrl}
                          title={player.location.name ?? ""}
                        />
                      </Avatar>
                    ) : null}
                    <span className="text-muted-foreground">{player.location?.name ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {player.club?.logoUrl ? (
                      <Avatar className="size-5 rounded-sm">
                        <AvatarImage
                          alt={player.club.name ?? ""}
                          className="object-contain"
                          src={player.club.logoUrl}
                        />
                      </Avatar>
                    ) : null}
                    <span className="text-muted-foreground">{player.club?.name ?? "—"}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={pagination.currentPage}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) =>
            navigate({
              to: "/ratings",
              search: { ...search, page: newPage },
            })
          }
        />
      </div>
    </>
  );
}
