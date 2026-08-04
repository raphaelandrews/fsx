import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_params/news/$slug")({
  head: () => ({
    title: "Notícia - FSX",
    meta: [
      { name: "description", content: "Notícia da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context, params }) =>
    context.trpc.posts.bySlug.ensureQueryData({ slug: params.slug }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { slug } = Route.useParams();
  const [post] = useSuspenseQuery(trpc.posts.bySlug.queryOptions({ slug }));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">{post.title}</h1>
      <p className="text-muted-foreground">Notícia — em construção</p>
    </div>
  );
}
