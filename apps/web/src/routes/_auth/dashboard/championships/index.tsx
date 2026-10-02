import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";

import { useTRPC } from "@/utils/trpc";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { useAdminMutation } from "@/lib/admin-mutations";

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
  const { data: items = [] } = useSuspenseQuery(trpc[DOMAIN].list.queryOptions());

  const deleteMutation = useAdminMutation(trpc[DOMAIN].delete.mutationOptions(), {
    invalidates: DOMAIN,
    success: "Championship deleted",
    failure: "Failed to delete championship",
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">{TITLE}</h1>
        <Link to={`${PATH}/create`}><Button>Create</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? items.map((item: { id: number; name: string }) => (
              <TableRow key={item.id}>
                <TableCell className="tabular-nums">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`${PATH}/$id`} params={{ id: item.id }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <ConfirmDeleteButton
                      itemName={item.name}
                      label="Delete"
                      pending={deleteMutation.isPending}
                      onConfirm={() => deleteMutation.mutate({ id: item.id })}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={3}>
                  No championships yet. Create one to start recording title holders.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
