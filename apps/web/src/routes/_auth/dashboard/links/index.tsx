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

export const Route = createFileRoute("/_auth/dashboard/links/")({
  head: () => ({ meta: [{ title: "Links - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: groups = [] } = useSuspenseQuery(trpc.links.list.queryOptions());

  const deleteGroupMutation = useMutation({
    ...trpc.links.deleteGroup.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.links.list.queryFilter());
      toast.success("Group deleted");
    },
    onError: () => toast.error("Failed to delete group"),
  });

  const deleteLinkMutation = useMutation({
    ...trpc.links.deleteLink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.links.list.queryFilter());
      toast.success("Link deleted");
    },
    onError: () => toast.error("Failed to delete link"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Links</h1>
        <Link to="/dashboard/links/create">
          <Button>Create Group</Button>
        </Link>
      </div>
      {groups.map((group) => (
        <div key={group.id} className="mb-4 rounded-md border p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">{group.label}</h2>
            <div className="flex gap-1">
              <Link to="/dashboard/links/$id" params={{ id: String(group.id) }}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
              <Button size="sm" variant="destructive" onClick={() => deleteGroupMutation.mutate({ id: group.id })}>
                Delete
              </Button>
            </div>
          </div>
          <Table className="border">
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>{link.label}</TableCell>
                  <TableCell className="text-muted-foreground">{link.href}</TableCell>
                  <TableCell>{link.icon}</TableCell>
                  <TableCell>{link.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => deleteLinkMutation.mutate({ id: link.id })}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
