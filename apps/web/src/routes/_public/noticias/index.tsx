import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Pagination } from "@/components/data-table/pagination";

import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { PostCard } from "@/components/post-card";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  page: z.number().int().positive().default(1),
});

// Keep content short-lived so admin edits appear fast on revisit; matches the
// short server-side cache TTL (see routes/api/trpc/$.ts) instead of the global
// 5m staleTime.
const PUBLICATION_STALE_TIME = 60_000;

export const Route = createFileRoute("/_public/noticias/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Notícias - FSX" },
      { name: "description", content: "Notícias da Federação Sergipana de Xadrez" },
    ],
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.posts.byPage.queryOptions({ page: deps.page }, { staleTime: PUBLICATION_STALE_TIME }),
    ),
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
            <PostCard
              key={post.id}
              title={post.title}
              imageUrl={post.imageUrl}
              slug={post.slug}
            />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={data.pagination.currentPage}
          hasNextPage={data.pagination.hasNextPage}
          hasPreviousPage={data.pagination.hasPreviousPage}
          totalPages={data.pagination.totalPages}
          onPageChange={(newPage) =>
            navigate({ to: "/noticias", search: { page: newPage } })
          }
        />
      </div>
    </>
  );
}
