import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/ratings")({
  head: () => ({
    meta: [
      { title: "Ratings - FSX" },
      { name: "description", content: "Ranking de ratings dos jogadores da FSX" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.players.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Ratings</h1>
      <p className="text-muted-foreground">Ratings — em construção</p>
    </div>
  );
}
