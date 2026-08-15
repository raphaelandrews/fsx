import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Button, buttonVariants } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";

import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  sexo: z.enum(["male", "female"]).optional(),
  page: z.number().int().positive().default(1),
  nome: z.string().optional(),
});

export const Route = createFileRoute("/_public/membros")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Membros - FSX" },
      { name: "description", content: "Lista de jogadores da Federação Sergipana de Xadrez" },
    ],
  }),
  loaderDeps: ({ search }) => ({ page: search.page, sex: search.sexo, name: search.nome }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.players.withFilters.queryOptions({
        page: deps.page,
        sex: deps.sex,
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
      name: search.nome,
    })
  );

  const [nameInput, setNameInput] = useState(search.nome ?? "");

  const updateSearch = (partial: Partial<typeof search>) => {
    navigate({ to: "/membros", search: { ...search, ...partial, page: 1 } });
  };

  const { players, pagination } = data;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Membros</h1>

      <div className="mb-4 flex flex-wrap items-end gap-2">
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

      {players.length === 0 ? (
        <p className="text-muted-foreground">Nenhum membro encontrado.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {players.map((player, index) => (
            <Link
              key={player.id}
              to="/jogadores/$id"
              params={{ id: String(player.id) }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
            >
              <span className="text-muted-foreground tabular-nums w-8">
                {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
              </span>
              <span className="font-medium">{player.nickname ?? player.name}</span>
              <span className="text-muted-foreground text-sm ml-auto">
                {player.playersToTitles.map((t) => t.title.shortName).join(", ")}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-2">
        {pagination.hasPreviousPage && (
          <Link
            to="/membros"
            search={{ ...search, page: pagination.currentPage - 1 }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Anterior
          </Link>
        )}
        <span className="text-xs text-muted-foreground">
          Página {pagination.currentPage} de {pagination.totalPages} · {pagination.totalItems} membros
        </span>
        {pagination.hasNextPage && (
          <Link
            to="/membros"
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
