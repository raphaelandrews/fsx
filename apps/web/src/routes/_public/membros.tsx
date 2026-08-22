import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select";

import { Pagination } from "@fsx/ui/components/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";

import { SearchInput } from "@/components/data-table/search-input";
import { PageHeader } from "@/components/page-header";
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

      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Títulos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player, index) => (
              <TableRow key={player.id}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  <Link
                    to="/jogadores/$id"
                    params={{ id: String(player.id) }}
                    className="font-medium hover:underline"
                  >
                    {player.nickname ?? player.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {player.playersToTitles.map((t) => t.title.shortName).join(", ") || "—"}
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
            navigate({ to: "/membros", search: { ...search, page: newPage } })
          }
        />
      </div>
    </>
  );
}
