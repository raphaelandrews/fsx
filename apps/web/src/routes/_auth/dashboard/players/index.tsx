import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import z from "zod";

import { Button } from "@fsx/ui/components/button";
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
import { AdminPageHeader } from "@/components/admin/page-header";

const PER_PAGE = 20;

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000).catch(1).optional(),
  name: z.string().trim().max(120).optional(),
});

export const Route = createFileRoute("/_auth/dashboard/players/")({
  head: () => ({ meta: [{ title: "Players - Admin - FSX" }] }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1, name: search.name }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.players.page.queryOptions({ page: deps.page, limit: PER_PAGE, name: deps.name }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { page = 1, name } = Route.useSearch();

  const { data } = useSuspenseQuery(
    trpc.players.page.queryOptions({ page, limit: PER_PAGE, name }),
  );
  const players = data.players;
  const pagination = data.pagination;

  const [searchInput, setSearchInput] = useState(name ?? "");

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/dashboard/players",
      search: { page: 1, name: searchInput.trim() || undefined },
    });
  };

  return (
    <div>
      <AdminPageHeader
        title="Players"
        description="Manage the state's players."
        actions={
          <Link to="/dashboard/players/create">
            <Button>New player</Button>
          </Link>
        }
      />

      <form onSubmit={submitSearch} className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Search player..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead className="text-right">Blitz</TableHead>
              <TableHead className="text-right">Rapid</TableHead>
              <TableHead className="text-right">Classic</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.length ? (
              players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.nickname ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{player.blitz ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{player.rapid ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{player.classic ?? "—"}</TableCell>
                  <TableCell>{player.club?.name ?? "—"}</TableCell>
                  <TableCell>{player.location?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to="/dashboard/players/titles" search={{ playerId: player.id }}>
                        <Button size="sm" variant="outline">
                          Titles
                        </Button>
                      </Link>
                      <Link to="/dashboard/players/$id" params={{ id: player.id }}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={8}>
                  No players found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} name={name} />
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  name,
}: {
  page: number;
  totalPages: number;
  name?: string;
}) {
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const search = (p: number) => ({ page: p, name });

  return (
      <nav aria-label="Paginação de jogadores" className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
        Página {safePage} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {safePage > 1 ? (
          <Button render={<Link to="/dashboard/players" search={search(safePage - 1)} />} variant="outline" size="sm">
            Anterior
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
        )}
        {safePage < totalPages ? (
          <Button render={<Link to="/dashboard/players" search={search(safePage + 1)} />} variant="outline" size="sm">
            Próxima
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Próxima
          </Button>
        )}
      </div>
    </nav>
  );
}
