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

export const Route = createFileRoute("/_auth/dashboard/norms/")({
  head: () => ({ meta: [{ title: "Norms - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.norms.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: norms = [] } = useSuspenseQuery(trpc.norms.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.norms.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.norms.list.queryFilter()); toast.success("Norm deleted"); },
    onError: () => toast.error("Failed to delete norm"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Norms</h1>
        <Link to="/dashboard/norms/create"><Button>Create Norm</Button></Link>
      </div>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Norm</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {norms.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="tabular-nums">{n.id}</TableCell>
                <TableCell>{n.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/norms/$id" params={{ id: String(n.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: n.id })}>Delete</Button>
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
