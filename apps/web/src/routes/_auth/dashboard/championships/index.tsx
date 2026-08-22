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

const TITLE = "Championships";
const PATH = "/dashboard/championships";
const DOMAIN = "champions";

export const Route = createFileRoute("/_auth/dashboard/championships/")({
  head: () => ({ meta: [{ title: `${TITLE} - Admin - FSX` }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: items = [] } = useSuspenseQuery(trpc[DOMAIN].list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc[DOMAIN].delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc[DOMAIN].list.queryFilter()); toast.success("Deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">{TITLE}</h1>
        <Link to={`${PATH}/create`}><Button>Create</Button></Link>
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
            {items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="tabular-nums">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`${PATH}/$id`} params={{ id: String(item.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: item.id })}>Delete</Button>
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
