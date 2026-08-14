import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournaments/")({
  head: () => ({ meta: [{ title: "Tournaments - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tournaments.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: tournaments = [] } = useSuspenseQuery(trpc.tournaments.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.tournaments.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tournaments.list.queryFilter()); toast.success("Tournament deleted"); },
    onError: () => toast.error("Failed to delete tournament"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Tournaments</h1>
        <Link to="/dashboard/tournaments/create"><Button>Create Tournament</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Rating</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-2">{t.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{t.date}</td>
                <td className="px-4 py-2">{t.ratingType}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/tournaments/$id" params={{ id: String(t.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: t.id })}>Delete</Button>
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
