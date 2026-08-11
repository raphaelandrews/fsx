import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fsx/ui/components/select";
import { toast } from "sonner";
import { useState } from "react";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  playerId: z.number().optional(),
});

export const Route = createFileRoute("/_auth/dashboard/players/titles")({
  head: () => ({ title: "Title Assignment - Admin - FSX" }),
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.trpc.players.list.ensureQueryData(),
      context.trpc.titles.list.ensureQueryData(),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { playerId } = Route.useSearch();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(playerId ?? null);

  const { data: players = [] } = useSuspenseQuery(trpc.players.list.queryOptions());
  const { data: titles = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());
  const { data: playerTitles = [] } = useSuspenseQuery(
    trpc.playersToTitles.listByPlayer.queryOptions({ playerId: selectedPlayerId ?? 0 }),
  );

  const linkMutation = useMutation({
    ...trpc.playersToTitles.link.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToTitles.listByPlayer.queryFilter({ playerId: selectedPlayerId ?? 0 }));
      toast.success("Title assigned");
    },
    onError: () => toast.error("Failed to assign title"),
  });

  const unlinkMutation = useMutation({
    ...trpc.playersToTitles.unlink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToTitles.listByPlayer.queryFilter({ playerId: selectedPlayerId ?? 0 }));
      toast.success("Title removed");
    },
    onError: () => toast.error("Failed to remove title"),
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Title Assignment</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Player</label>
        <Select
          value={selectedPlayerId?.toString() ?? ""}
          onValueChange={(v) => setSelectedPlayerId(v ? Number(v) : null)}
        >
          <SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger>
          <SelectContent>
            {players.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedPlayerId && (
        <>
          <div className="mb-4">
            <h2 className="mb-2 font-semibold">Current Titles</h2>
            <div className="flex flex-wrap gap-2">
              {playerTitles.length === 0 && <p className="text-muted-foreground text-sm">No titles assigned.</p>}
              {playerTitles.map((pt) => (
                <span key={pt.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                  {pt.title?.title}
                  <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => unlinkMutation.mutate({ id: pt.id })}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Assign New Title</h2>
            <Select onValueChange={(v) => { if (v) linkMutation.mutate({ playerId: selectedPlayerId, titleId: Number(v) }); }}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select title" /></SelectTrigger>
              <SelectContent>
                {titles.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.title} ({t.shortTitle})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
