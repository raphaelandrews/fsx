import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/")({
  head: () => ({ meta: [{ title: "Tournament Podiums - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tournamentPodiums.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: podiums = [] } = useSuspenseQuery(trpc.tournamentPodiums.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.tournamentPodiums.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tournamentPodiums.list.queryFilter()); toast.success("Podium deleted"); },
    onError: () => toast.error("Failed to delete podium"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Tournament Podiums</h1>
        <Link to="/dashboard/tournament-podiums/create"><Button>Create Podium</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">Player</th><th className="px-4 py-2 text-left">Tournament</th><th className="px-4 py-2 text-right">Place</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {podiums.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.player?.name ?? `#${p.playerId}`}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.tournament?.name ?? `#${p.tournamentId}`}</td>
                <td className="px-4 py-2 text-right">{p.place}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/tournament-podiums/$id" params={{ id: String(p.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: p.id })}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
