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

export const Route = createFileRoute("/_auth/dashboard/links/")({
  head: () => ({ meta: [{ title: "Links - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data: groups = [] } = useSuspenseQuery(trpc.links.list.queryOptions());

  const deleteGroupMutation = useAdminMutation(trpc.links.deleteGroup.mutationOptions(), {
    invalidates: "links",
    success: "Group deleted",
    failure: "Failed to delete group",
  });

  const deleteLinkMutation = useAdminMutation(trpc.links.deleteLink.mutationOptions(), {
    invalidates: "links",
    success: "Link deleted",
    failure: "Failed to delete link",
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Links</h1>
        <Link to="/dashboard/links/create">
          <Button>Create Group</Button>
        </Link>
      </div>
      {groups
        .filter((group) => group.eventId == null)
        .map((group) => (
        <div key={group.id} className="mb-4 rounded-md border p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">{group.label}</h2>
            <div className="flex gap-1">
              <Link to="/dashboard/links/$id" params={{ id: group.id }}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
              <ConfirmDeleteButton
                itemName={group.label}
                pending={deleteGroupMutation.isPending}
                label="Delete"
                onConfirm={() => deleteGroupMutation.mutate({ id: group.id })}
              />
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
                    <ConfirmDeleteButton
                      itemName={link.label}
                      pending={deleteLinkMutation.isPending}
                      label="Delete"
                      onConfirm={() => deleteLinkMutation.mutate({ id: link.id })}
                    />
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
