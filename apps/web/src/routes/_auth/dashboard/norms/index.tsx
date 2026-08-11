import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/")({
  head: () => ({ title: "Norms - Admin - FSX" }),
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
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">ID</th><th className="px-4 py-2 text-left">Norm</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {norms.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="px-4 py-2">{n.id}</td>
                <td className="px-4 py-2">{n.norm}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/norms/$id" params={{ id: String(n.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: n.id })}>Delete</Button>
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
