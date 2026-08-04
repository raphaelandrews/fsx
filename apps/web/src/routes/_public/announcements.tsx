import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/announcements")({
  head: () => ({
    title: "Comunicados - FSX",
    meta: [
      { name: "description", content: "Comunicados oficiais da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => context.trpc.announcements.byPage.ensureQueryData({ page: 1 }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Comunicados</h1>
      <p className="text-muted-foreground">Comunicados — em construção</p>
    </div>
  );
}
