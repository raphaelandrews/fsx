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

export const Route = createFileRoute("/_auth/dashboard/titles/")({
  head: () => ({ meta: [{ title: "Titles - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: titles = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.titles.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.titles.list.queryFilter()); toast.success("Title deleted"); },
    onError: () => toast.error("Failed to delete title"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Titles</h1>
        <Link to="/dashboard/titles/create"><Button>Create Title</Button></Link>
      </div>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Short</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {titles.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.shortName}</TableCell>
                <TableCell className="text-muted-foreground">{t.type}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/titles/$id" params={{ id: String(t.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
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
