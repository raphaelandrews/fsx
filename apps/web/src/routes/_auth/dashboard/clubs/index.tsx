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

export const Route = createFileRoute("/_auth/dashboard/clubs/")({
  head: () => ({ meta: [{ title: "Clubs - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: clubs = [] } = useSuspenseQuery(trpc.clubs.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.clubs.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.clubs.list.queryFilter());
      toast.success("Club deleted");
    },
    onError: () => toast.error("Failed to delete club"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Clubs</h1>
        <Link to="/dashboard/clubs/create">
          <Button>Create Club</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clubs.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="tabular-nums">{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/clubs/$id" params={{ id: String(c.id) }}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: c.id })}>
                      Delete
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
