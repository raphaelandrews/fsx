import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { useVirtualList } from "@/hooks/use-virtual-list";

export const Route = createFileRoute("/_public/members")({
  head: () => ({
    meta: [
      { title: "Membros - FSX" },
      { name: "description", content: "Lista de jogadores da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.players.withFilters.queryOptions({})),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.players.withFilters.queryOptions({}));
  const { parentRef, virtualizer } = useVirtualList(data.players, { estimateSize: 56 });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Membros</h1>
      <div
        ref={parentRef}
        className="relative h-[600px] overflow-auto rounded-lg border"
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const player = data.players[virtualItem.index];
            return (
              <div
                key={player.id}
                className="absolute top-0 left-0 w-full"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="flex items-center gap-3 px-4 py-2 h-full border-b">
                  <span className="text-muted-foreground text-sm tabular-nums w-8">
                    {virtualItem.index + 1}
                  </span>
                  <span className="font-medium">{player.name}</span>
                  <span className="text-muted-foreground text-sm ml-auto">
                    {player.playersToTitles.map((t: { title: { shortName: string } }) => t.title.shortName).join(", ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
