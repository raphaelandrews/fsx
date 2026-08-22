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

export const Route = createFileRoute("/_auth/dashboard/circuits/")({
  head: () => ({ meta: [{ title: "Circuits - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.circuits.listSimple.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: circuits = [] } = useSuspenseQuery(trpc.circuits.listSimple.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.circuits.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.circuits.listSimple.queryFilter()); toast.success("Circuit deleted"); },
    onError: () => toast.error("Failed to delete circuit"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Circuits</h1>
        <Link to="/dashboard/circuits/create"><Button>Create Circuit</Button></Link>
      </div>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {circuits.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.type}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/circuits/$id" params={{ id: String(c.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: c.id })}>Delete</Button>
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
