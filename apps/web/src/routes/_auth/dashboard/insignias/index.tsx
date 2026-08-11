import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/insignias/")({
  head: () => ({ title: "Insignias - Admin - FSX" }),
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
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">ID</th><th className="px-4 py-2 text-left">Insignia</th><th className="px-4 py-2 text-left">Level</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {insignias.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-4 py-2">{i.id}</td>
                <td className="px-4 py-2">{i.insignia}</td>
                <td className="px-4 py-2">{i.level}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/insignias/$id" params={{ id: String(i.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: i.id })}>Delete</Button>
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
