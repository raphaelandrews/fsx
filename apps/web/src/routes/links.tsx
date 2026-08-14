import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Links - FSX" },
      { name: "description", content: "Links úteis do xadrez sergipano" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Links</h1>
      <p className="text-muted-foreground">Links — em construção</p>
    </div>
  );
}
