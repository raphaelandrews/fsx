import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Pagination } from "@/components/data-table/pagination";

import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { PostCard } from "@/components/post-card";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  page: z.number().int().positive().max(1_000).default(1),
});

// Keep content short-lived so admin edits appear fast on revisit; matches the
// short server-side cache TTL (see routes/api/trpc/$.ts) instead of the global
// 5m staleTime.
const PUBLICATION_STALE_TIME = 60_000;

export const Route = createFileRoute("/_public/noticias/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.posts.byPage.queryOptions(
        { page: deps.page },
        { staleTime: PUBLICATION_STALE_TIME },
      ),
    ),
  head: ({ loaderData }) => {
    const page = loaderData?.pagination.currentPage ?? 1;
    return buildSeo({
      title: page > 1 ? withBrand(`Notícias — Página ${page}`) : withBrand("Notícias"),
      description:
        "Últimas notícias, torneios e novidades do xadrez em Sergipe, pela Federação Sergipana de Xadrez.",
      path: page > 1 ? `/noticias?page=${page}` : "/noticias",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Notícias", path: "/noticias" },
      ]),
    });
  },
  pendingComponent: () => <CardGridSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { page } = Route.useSearch();
  const { data } = useSuspenseQuery(
    trpc.posts.byPage.queryOptions({ page }, { staleTime: PUBLICATION_STALE_TIME }),
  );

  return (
    <>
      <PageHeader title="Notícias" />

      {data.posts.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma notícia publicada.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.posts.map((post) => (
            <PostCard key={post.id} title={post.title} imageUrl={post.imageUrl} slug={post.slug} />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={data.pagination.currentPage}
          hasNextPage={data.pagination.hasNextPage}
          hasPreviousPage={data.pagination.hasPreviousPage}
          totalPages={data.pagination.totalPages}
          onPageChange={(newPage) => navigate({ to: "/noticias", search: { page: newPage } })}
        />
      </div>
    </>
  );
}
