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

export const Route = createFileRoute("/_auth/dashboard/players/")({
  head: () => ({ meta: [{ title: "Players - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.players.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: players = [] } = useSuspenseQuery(trpc.players.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.players.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.players.list.queryFilter());
      toast.success("Player deleted");
    },
    onError: () => toast.error("Failed to delete player"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Players</h1>
        <Link to="/dashboard/players/create">
          <Button>Create Player</Button>
        </Link>
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead className="text-right">Blitz</TableHead>
              <TableHead className="text-right">Rapid</TableHead>
              <TableHead className="text-right">Classic</TableHead>
              <TableHead className="text-center">Sex</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.nickname}</TableCell>
                <TableCell className="text-right tabular-nums">{p.blitz}</TableCell>
                <TableCell className="text-right tabular-nums">{p.rapid}</TableCell>
                <TableCell className="text-right tabular-nums">{p.classic}</TableCell>
                <TableCell className="text-center">{p.sex === "female" ? "F" : "M"}</TableCell>
                <TableCell>{p.club?.name}</TableCell>
                <TableCell>{p.location?.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/players/$id" params={{ id: String(p.id) }}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Link to="/dashboard/players/titles" search={{ playerId: p.id }}>
                      <Button size="sm" variant="outline">Titles</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ id: p.id, active: false })}
                    >
                      Deactivate
                    </Button>
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
