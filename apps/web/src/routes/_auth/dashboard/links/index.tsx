import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/links/")({
  head: () => ({ title: "Links - Admin - FSX" }),
  loader: ({ context }) => context.trpc.links.list.ensureQueryData(),
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
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => deleteGroupMutation.mutate({ id: group.id })}>
                Delete
              </Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-2 py-1 text-left">Label</th>
                <th className="px-2 py-1 text-left">URL</th>
                <th className="px-2 py-1 text-left">Icon</th>
                <th className="px-2 py-1 text-left">Order</th>
                <th className="px-2 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {group.links.map((link) => (
                <tr key={link.id} className="border-t">
                  <td className="px-2 py-1">{link.label}</td>
                  <td className="px-2 py-1 text-muted-foreground">{link.href}</td>
                  <td className="px-2 py-1">{link.icon}</td>
                  <td className="px-2 py-1">{link.order}</td>
                  <td className="px-2 py-1 text-right">
                    <Button variant="destructive" size="sm" onClick={() => deleteLinkMutation.mutate({ id: link.id })}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
