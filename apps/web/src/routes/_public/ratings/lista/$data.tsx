import { createFileRoute, Link, notFound, stripSearchParams, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChartIcon } from "@hugeicons/core-free-icons";

import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fsx/ui/components/table";

import { Pagination } from "@/components/data-table/pagination";
import { PageHeader } from "@/components/page-header";
import { formatArchiveDate, RHYTHM_TABS } from "@/components/ratings-archive/format";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { orNotFound } from "@/lib/errors";
import { ratingArchiveSearchSchema } from "@/lib/search-schemas";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/lib/trpc";

const dateParams = {
  parse: ({ data }: { data: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`))) throw notFound();
    return { data };
  },
  stringify: ({ data }: { data: string }) => ({ data }),
};

export const Route = createFileRoute("/_public/ratings/lista/$data")({
  params: dateParams,
  validateSearch: ratingArchiveSearchSchema,
  search: { middlewares: [stripSearchParams({ ritmo: "rapid", page: 1 })] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        context.trpc.ratings.snapshot.queryOptions({ date: params.data, ratingType: deps.ritmo, page: deps.page }),
      ),
    ),
  head: ({ params }) =>
    buildSeo({
      title: withBrand(`Ratings em ${formatArchiveDate(params.data)}`),
      description: `Lista de rating da Federação Sergipana de Xadrez publicada em ${formatArchiveDate(params.data)}.`,
      path: `/ratings/lista/${params.data}`,
      noindex: true,
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Ratings", path: "/ratings" },
        { name: "Listas anteriores", path: "/ratings/lista" },
        { name: formatArchiveDate(params.data), path: `/ratings/lista/${params.data}` },
      ]),
    }),
  pendingComponent: () => <TableSkeleton cols={4} />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const router = useRouter();
  const { data: date } = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(
    trpc.ratings.snapshot.queryOptions({ date, ratingType: search.ritmo, page: search.page }),
  );
  const { pagination } = data;

  return (
    <>
      <PageHeader icon={BarChartIcon} title={`Ratings em ${formatArchiveDate(date)}`} description="Lista publicada nesta data, com os jogadores ativos na época." />

      <p className="mb-4 text-center text-sm">
        <Link to="/ratings/lista" search={{ ritmo: search.ritmo }} className="link-inline">
          Todas as listas anteriores
        </Link>
      </p>

      <Tabs
        className="mb-4 w-full"
        value={search.ritmo}
        onValueChange={(value) => navigate({ to: "/ratings/lista/$data", params: { data: date }, search: { ritmo: value as typeof search.ritmo } })}
      >
        <div className="flex justify-center">
          <TabsList aria-label="Ritmo">
            {RHYTHM_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead className="text-center">Rating</TableHead>
            <TableHead>Clube</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="text-center text-muted-foreground tabular-nums">{player.position}</TableCell>
              <TableCell>
                <Link to="/jogadores/$id" params={{ id: player.id }} className="link-inline font-medium">
                  {player.name}
                </Link>
              </TableCell>
              <TableCell className="text-center font-medium tabular-nums">{player.rating}</TableCell>
              <TableCell className="text-muted-foreground">{player.club ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={pagination.currentPage}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          totalPages={pagination.totalPages}
          onPageChange={(next) => navigate({ to: "/ratings/lista/$data", params: { data: date }, search: { ...search, page: next } })}
          onPagePreload={(next) => void router.preloadRoute({ to: "/ratings/lista/$data", params: { data: date }, search: { ...search, page: next } })}
          getPageHref={(next) => router.buildLocation({ to: "/ratings/lista/$data", params: { data: date }, search: { ...search, page: next } }).href}
        />
      </div>
    </>
  );
}
