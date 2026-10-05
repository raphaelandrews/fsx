import { Link, createFileRoute, stripSearchParams, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fsx/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { ClubLogo } from "@/components/clubes/club-logo";
import { EmptyTableRow } from "@/components/data-table/empty-table-row";
import { Pagination } from "@/components/data-table/pagination";
import { Medal } from "@/components/gamification/medal";
import { UserGroupIcon } from "@hugeicons/core-free-icons";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  ritmo: z.enum(["classic", "rapid", "blitz"]).default("rapid"),
  page: z.number().int().positive().max(1_000).default(1),
});

const PAGE_SIZE = 20;

export const Route = createFileRoute("/_public/clubes/")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams({ ritmo: "rapid", page: 1 })] },
  head: () =>
    buildSeo({
      title: withBrand("Clubes"),
      description:
        "Ranking dos clubes de xadrez de Sergipe pela média dos cinco melhores jogadores ativos, com o quadro de medalhas de cada clube.",
      path: "/clubes",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Clubes", path: "/clubes" },
      ]),
    }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.clubs.leaderboard.queryOptions()),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const router = useRouter();
  const { ritmo, page } = Route.useSearch();
  const { data: standings } = useSuspenseQuery(trpc.clubs.leaderboard.queryOptions());

  const ranked = standings.filter((s) => s.rank[ritmo] !== null).sort((a, b) => a.rank[ritmo]! - b.rank[ritmo]!);
  const unranked = standings
    .filter((s) => s.rank[ritmo] === null && s.activeMembers > 0)
    .sort((a, b) => b.activeMembers - a.activeMembers || a.club.name.localeCompare(b.club.name, "pt-BR"));
  const rows = [...ranked, ...unranked];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageSearch = (n: number) => ({ ritmo, page: n });

  return (
    <>
      <PageHeader icon={UserGroupIcon}
        title="Clubes"
        description="Ranking pela média dos 5 melhores jogadores ativos de cada clube."
      />

      <Tabs
        className="mb-4 w-full"
        value={ritmo}
        onValueChange={(value) => navigate({ to: "/clubes", search: { ritmo: value as typeof ritmo } })}
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="classic">Clássico</TabsTrigger>
            <TabsTrigger value="rapid">Rápido</TabsTrigger>
            <TabsTrigger value="blitz">Blitz</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Clube</TableHead>
            <TableHead className="text-center">Força</TableHead>
            <TableHead className="text-center">Ativos</TableHead>
            <TableHead>Medalhas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <EmptyTableRow colSpan={5}>Nenhum clube com jogadores ativos.</EmptyTableRow>
          )}
          {pageRows.map((standing) => (
            <TableRow key={standing.club.id}>
              <TableCell className="text-center text-muted-foreground tabular-nums">{standing.rank[ritmo] ?? "—"}</TableCell>
              <TableCell>
                <Link
                  to="/clubes/$id"
                  params={{ id: standing.club.id }}
                  className="flex items-center gap-2 font-medium hover:underline"
                >
                  <ClubLogo name={standing.club.name} logoUrl={standing.club.logoUrl} />
                  {standing.club.name}
                </Link>
              </TableCell>
              <TableCell className="text-center font-medium tabular-nums">{standing.strength[ritmo] ?? "—"}</TableCell>
              <TableCell className="text-center tabular-nums">{standing.activeMembers}</TableCell>
              <TableCell>
                <span className="flex gap-1">
                  {standing.medals.gold > 0 && <Medal place={1} count={standing.medals.gold} />}
                  {standing.medals.silver > 0 && <Medal place={2} count={standing.medals.silver} />}
                  {standing.medals.bronze > 0 && <Medal place={3} count={standing.medals.bronze} />}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasPreviousPage={currentPage > 1}
          hasNextPage={currentPage < totalPages}
          onPageChange={(n) => navigate({ to: "/clubes", search: pageSearch(n) })}
          getPageHref={(n) => router.buildLocation({ to: "/clubes", search: pageSearch(n) }).href}
        />
      </div>
      <p className="mt-4 text-center text-muted-foreground text-sm">
        {unranked.length > 0 && "Clubes com menos de 5 jogadores ativos aparecem sem posição. "}
        As medalhas somam os pódios em torneios e circuitos dos jogadores que hoje são do clube.
      </p>
    </>
  );
}
