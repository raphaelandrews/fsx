import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/roles/")({
  head: () => ({ title: "Roles - Admin - FSX" }),
  loader: ({ context }) => context.trpc.roles.list.ensureQueryData(),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: roles = [] } = useSuspenseQuery(trpc.roles.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.roles.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.roles.list.queryFilter()); toast.success("Role deleted"); },
    onError: () => toast.error("Failed to delete role"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Roles</h1>
        <Link to="/dashboard/roles/create"><Button>Create Role</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">Role</th><th className="px-4 py-2 text-left">Short</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.role}</td>
                <td className="px-4 py-2">{r.shortRole}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.type}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/roles/$id" params={{ id: String(r.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: r.id })}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
