import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/players/")({
  head: () => ({ title: "Players - Admin - FSX" }),
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
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Nickname</th>
              <th className="px-4 py-2 text-right">Blitz</th>
              <th className="px-4 py-2 text-right">Rapid</th>
              <th className="px-4 py-2 text-right">Classic</th>
              <th className="px-4 py-2 text-center">Sex</th>
              <th className="px-4 py-2 text-left">Club</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.nickname}</td>
                <td className="px-4 py-2 text-right">{p.blitz}</td>
                <td className="px-4 py-2 text-right">{p.rapid}</td>
                <td className="px-4 py-2 text-right">{p.classic}</td>
                <td className="px-4 py-2 text-center">{p.sex === "female" ? "F" : "M"}</td>
                <td className="px-4 py-2">{p.club?.name}</td>
                <td className="px-4 py-2">{p.location?.name}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/players/$id" params={{ id: String(p.id) }}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Link to="/dashboard/players/titles" search={{ playerId: p.id }}>
                      <Button variant="outline" size="sm">Titles</Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: p.id, active: false })}
                    >
                      Deactivate
                    </Button>
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
