import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/news")({
  head: () => ({
    title: "Notícias - FSX",
    meta: [
      { name: "description", content: "Notícias da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => context.trpc.posts.list.ensureQueryData(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Notícias</h1>
      <p className="text-muted-foreground">Notícias — em construção</p>
    </div>
  );
}
