import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/bullet")({
  head: () => ({
    meta: [
      { title: "Boletim - FSX" },
      { name: "description", content: "Boletim da Federação Sergipana de Xadrez" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Boletim</h1>
      <p className="text-muted-foreground">Boletim — em construção</p>
    </div>
  );
}
