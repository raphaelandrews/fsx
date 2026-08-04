import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/swiss-manager")({
  head: () => ({
    title: "Swiss Manager - FSX",
    meta: [
      { name: "description", content: "Swiss Manager da Federação Sergipana de Xadrez" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Swiss Manager</h1>
      <p className="text-muted-foreground">Swiss Manager — em construção</p>
    </div>
  );
}
