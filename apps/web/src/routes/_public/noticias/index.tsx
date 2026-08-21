import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { buttonVariants } from "@fsx/ui/components/button";

import { PostCard } from "@/components/post-card";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  page: z.number().int().positive().default(1),
});

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
    context.queryClient.ensureQueryData(context.trpc.posts.byPage.queryOptions({ page: deps.page })),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { page } = Route.useSearch();
  const { data } = useSuspenseQuery(trpc.posts.byPage.queryOptions({ page }));

  return (
    <>
      <h1 className="mb-4 font-bold text-3xl lg:text-4xl">Notícias</h1>

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

      <div className="mt-6 flex items-center justify-center gap-2">
        {data.pagination.hasPreviousPage && (
          <Link
            to="/noticias"
            search={{ page: data.pagination.currentPage - 1 }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Anterior
          </Link>
        )}
        <span className="text-xs text-muted-foreground">
          Página {data.pagination.currentPage} de {data.pagination.totalPages}
        </span>
        {data.pagination.hasNextPage && (
          <Link
            to="/noticias"
            search={{ page: data.pagination.currentPage + 1 }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Próxima
          </Link>
        )}
      </div>
    </>
  );
}
