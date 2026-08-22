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

export const Route = createFileRoute("/_auth/dashboard/insignias/")({
  head: () => ({ meta: [{ title: "Insignias - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.insignias.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: insignias = [] } = useSuspenseQuery(trpc.insignias.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.insignias.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.insignias.list.queryFilter()); toast.success("Insignia deleted"); },
    onError: () => toast.error("Failed to delete insignia"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Insignias</h1>
        <Link to="/dashboard/insignias/create"><Button>Create Insignia</Button></Link>
      </div>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Insignia</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insignias.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="tabular-nums">{i.id}</TableCell>
                <TableCell>{i.name}</TableCell>
                <TableCell>{i.level}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/insignias/$id" params={{ id: String(i.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: i.id })}>Delete</Button>
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
