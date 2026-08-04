import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/circuits")({
  head: () => ({
    title: "Circuitos - FSX",
    meta: [
      { name: "description", content: "Circuitos de torneios da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => context.trpc.circuits.list.ensureQueryData(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Circuitos</h1>
      <p className="text-muted-foreground">Circuitos — em construção</p>
    </div>
  );
}
