import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre - FSX" },
      { name: "description", content: "Sobre a Federação Sergipana de Xadrez" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Sobre</h1>
      <p className="text-muted-foreground">Sobre — em construção</p>
    </div>
  );
}
