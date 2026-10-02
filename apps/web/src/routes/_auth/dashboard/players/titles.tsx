import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fsx/ui/components/select";
import z from "zod";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { orNotFound } from "@/lib/errors";
import { SearchableSelect } from "@/components/searchable-select";

const searchSchema = z.object({
  playerId: z.number().int().positive().optional().catch(undefined),
});

export const Route = createFileRoute("/_auth/dashboard/players/titles")({
  head: () => ({ meta: [{ title: "Title Assignment - Admin - FSX" }] }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ playerId: search.playerId }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
      deps.playerId
        ? orNotFound(context.queryClient.ensureQueryData(context.trpc.players.byId.queryOptions({ id: deps.playerId })))
        : undefined,
      deps.playerId
        ? context.queryClient.ensureQueryData(
            context.trpc.playersToTitles.listByPlayer.queryOptions({ playerId: deps.playerId }),
          )
        : undefined,
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { playerId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const trpc = useTRPC();

  const { data: selected } = useQuery({
    ...trpc.players.byId.queryOptions({ id: playerId ?? 0 }),
    enabled: playerId !== undefined,
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Title Assignment</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Player</label>
        <SearchableSelect
          key={playerId ?? "none"}
          value={playerId?.toString() ?? ""}
          onChange={(v) => navigate({ search: { playerId: v ? Number(v) : undefined } })}
          getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
          placeholder="Search player..."
          emptyText="No player found."
          initialLabel={selected?.name}
        />
      </div>

      {playerId && <PlayerTitles playerId={playerId} />}
    </div>
  );
}

function PlayerTitles({ playerId }: { playerId: number }) {
  const trpc = useTRPC();

  const { data: titles = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());
  const { data: playerTitles = [] } = useSuspenseQuery(
    trpc.playersToTitles.listByPlayer.queryOptions({ playerId }),
  );

  const linkMutation = useAdminMutation(trpc.playersToTitles.link.mutationOptions(), {
    invalidates: "playersToTitles",
    success: "Title assigned",
    failure: "Failed to assign title",
  });

  const unlinkMutation = useAdminMutation(trpc.playersToTitles.unlink.mutationOptions(), {
    invalidates: "playersToTitles",
    success: "Title removed",
    failure: "Failed to remove title",
  });

  return (
    <>
      <div className="mb-4">
        <h2 className="mb-2 font-semibold">Current Titles</h2>
        <div className="flex flex-wrap gap-2">
          {playerTitles.length === 0 && <p className="text-muted-foreground text-sm">No titles assigned.</p>}
          {playerTitles.map((pt) => (
            <span key={pt.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
              {pt.title?.name}
              <button
                type="button"
                aria-label={`Remove ${pt.title?.name ?? "title"}`}
                className="ml-1 text-muted-foreground hover:text-destructive"
                onClick={() => unlinkMutation.mutate({ id: pt.id })}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Assign New Title</h2>
        <Select onValueChange={(v) => { if (v) linkMutation.mutate({ playerId, titleId: Number(v) }); }}>
          <SelectTrigger className="w-64" aria-label="Title"><SelectValue placeholder="Select title" /></SelectTrigger>
          <SelectContent>
            {titles.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.shortName})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
