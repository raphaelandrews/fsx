import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import z from "zod";

import { buttonVariants } from "@fsx/ui/components/button";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PlayerTitlesSection } from "@/components/admin/player-relations";
import { FormField } from "@/components/form/form-field";
import { SearchableSelect } from "@/components/searchable-select";
import { orNotFound } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  playerId: z.number().int().positive().optional().catch(undefined),
});

export const Route = createFileRoute("/_auth/dashboard/players/titles")({
  head: () => ({ meta: [{ title: "Assign titles - Admin - FSX" }] }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ playerId: search.playerId }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
      deps.playerId
        ? orNotFound(
            context.queryClient.ensureQueryData(
              context.trpc.players.byId.queryOptions({ id: deps.playerId }),
            ),
          )
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
    <>
      <AdminPageHeader
        backTo="/dashboard/players"
        backLabel="Players"
        title="Assign titles"
        description="Pick a player, then assign or remove their titles."
        actions={
          playerId ? (
            <Link
              to="/dashboard/players/$id"
              params={{ id: playerId }}
              className={buttonVariants({ variant: "outline" })}
            >
              Edit player
            </Link>
          ) : null
        }
      />
      <div className="max-w-md">
        <FormField label="Player" htmlFor="titles-player">
          <SearchableSelect
            key={playerId ?? "none"}
            id="titles-player"
            value={playerId?.toString() ?? ""}
            onChange={(value) =>
              navigate({ search: { playerId: value ? Number(value) : undefined } })
            }
            getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
            placeholder="Search player..."
            emptyText="No player found."
            initialLabel={selected?.name}
          />
        </FormField>
      </div>
      {playerId ? <PlayerTitlesSection playerId={playerId} /> : null}
    </>
  );
}
