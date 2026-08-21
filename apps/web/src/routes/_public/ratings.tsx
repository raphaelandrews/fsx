import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Button, buttonVariants } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";

import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  sexo: z.enum(["male", "female"]).optional(),
  ordenar: z.enum(["rapid", "blitz", "classic"]).default("rapid"),
  page: z.number().int().positive().default(1),
  nome: z.string().optional(),
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
    sex: search.sexo,
    sortBy: search.ordenar,
    name: search.nome,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.players.withFilters.queryOptions({
        page: deps.page,
        sex: deps.sex,
        sortBy: deps.sortBy,
        name: deps.name,
      })
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(
    trpc.players.withFilters.queryOptions({
      page: search.page,
      sex: search.sexo,
      sortBy: search.ordenar,
      name: search.nome,
    })
  );

  const [nameInput, setNameInput] = useState(search.nome ?? "");

  const updateSearch = (partial: Partial<typeof search>) => {
    navigate({ to: "/ratings", search: { ...search, ...partial, page: 1 } });
  };

  const { players, pagination } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Ratings</h1>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ordenar por
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={search.ordenar}
            onChange={(e) => updateSearch({ ordenar: e.target.value as typeof search.ordenar })}
          >
            <option value="rapid">Rápido</option>
            <option value="blitz">Blitz</option>
            <option value="classic">Clássico</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Sexo
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={search.sexo ?? ""}
            onChange={(e) => updateSearch({ sexo: (e.target.value || undefined) as typeof search.sexo })}
          >
            <option value="">Todos</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
          </select>
        </label>

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ nome: nameInput.trim() || undefined });
          }}
        >
          <Input
            className="h-8 w-48"
            placeholder="Buscar jogador..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <Button type="submit" size="sm" variant="outline">Buscar</Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead>Clube</TableHead>
              <TableHead className="text-right">Rápido</TableHead>
              <TableHead className="text-right">Blitz</TableHead>
              <TableHead className="text-right">Clássico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player, index) => (
              <TableRow key={player.id}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  <Link to="/jogadores/$id" params={{ id: String(player.id) }} className="font-medium hover:underline">
                    {player.playersToTitles[0] && (
                      <span className="text-highlight mr-1">{player.playersToTitles[0].title.shortName}</span>
                    )}
                    {player.nickname ?? player.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{player.club?.name ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{player.rapid}</TableCell>
                <TableCell className="text-right tabular-nums">{player.blitz}</TableCell>
                <TableCell className="text-right tabular-nums">{player.classic}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {pagination.hasPreviousPage && (
          <Link
            to="/ratings"
            search={{ ...search, page: pagination.currentPage - 1 }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Anterior
          </Link>
        )}
        <span className="text-xs text-muted-foreground">
          Página {pagination.currentPage} de {pagination.totalPages} · {pagination.totalItems} jogadores
        </span>
        {pagination.hasNextPage && (
          <Link
            to="/ratings"
            search={{ ...search, page: pagination.currentPage + 1 }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
