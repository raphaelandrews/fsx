import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/normas-tecnicas")({
  head: () => ({
    meta: [
      { title: "Normas Técnicas - FSX" },
      { name: "description", content: "Normas técnicas da Federação Sergipana de Xadrez" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Normas Técnicas</h1>
      <p className="text-muted-foreground">Normas Técnicas — em construção</p>
    </div>
  );
}
