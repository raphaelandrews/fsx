import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";
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
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Tournament</TableHead>
              <TableHead className="text-right">Place</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {podiums.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.player?.name ?? `#${p.playerId}`}</TableCell>
                <TableCell className="text-muted-foreground">{p.tournament?.name ?? `#${p.tournamentId}`}</TableCell>
                <TableCell className="text-right tabular-nums">{p.place}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/tournament-podiums/$id" params={{ id: String(p.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: p.id })}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
