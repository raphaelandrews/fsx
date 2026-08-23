import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@fsx/ui/components/avatar";
import { Badge } from "@fsx/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select";

import { Pagination } from "@fsx/ui/components/pagination";

import { SearchInput } from "@/components/data-table/search-input";
import { PageHeader } from "@/components/page-header";
import { getGradient } from "@/lib/gradients";
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
    <>
      <PageHeader title="Membros" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Sexo
          <Select
            onValueChange={(value) =>
              updateSearch({
                sexo: (value?.trim() || undefined) as typeof search.sexo,
              })
            }
            value={search.sexo ?? ""}
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Todos</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <form
          className="flex flex-col gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ nome: nameInput.trim() || undefined });
          }}
        >
          <span className="text-xs text-muted-foreground">Buscar</span>
          <SearchInput
            placeholder="Nome do jogador..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </form>
      </div>

      {players.length === 0 ? (
        <p className="text-muted-foreground">Nenhum membro encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={pagination.currentPage}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) =>
            navigate({ to: "/membros", search: { ...search, page: newPage } })
          }
        />
      </div>
    </>
  );
}

interface PlayerCardData {
  id: number;
  name: string;
  nickname: string | null;
  imageUrl: string | null;
  playersToTitles: { title: { shortName: string } }[];
}

function PlayerCard({ player }: { player: PlayerCardData }) {
  const firstTitle = player.playersToTitles?.[0]?.title.shortName;
  const gradient = getGradient(player.id);

  return (
    <Link
      aria-label={`Ver perfil de ${player.nickname ?? player.name}`}
      className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      to="/jogadores/$id"
      params={{ id: String(player.id) }}
    >
      <Avatar className="size-20 rounded-md">
        <AvatarImage alt={player.name} src={player.imageUrl ?? undefined} />
        <AvatarFallback style={gradient} />
      </Avatar>

      <div className="flex flex-col items-center gap-1">
        {firstTitle ? (
          <span className="text-xs font-semibold text-highlight">
            {firstTitle}
          </span>
        ) : null}
        <span className="font-medium leading-tight">
          {player.nickname ?? player.name}
        </span>
        {player.nickname ? (
          <span className="text-xs text-muted-foreground">{player.name}</span>
        ) : null}
      </div>

      {player.playersToTitles.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-1">
          {player.playersToTitles.map((t) => (
            <Badge
              className="rounded-full px-2 font-normal"
              key={t.title.shortName}
              variant="secondary"
            >
              {t.title.shortName}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
