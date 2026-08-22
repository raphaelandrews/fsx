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
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.date}</TableCell>
                <TableCell>{t.ratingType}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/tournaments/$id" params={{ id: String(t.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: t.id })}>Delete</Button>
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
