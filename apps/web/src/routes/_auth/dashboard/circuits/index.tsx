import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/circuits/")({
  head: () => ({ title: "Circuits - Admin - FSX" }),
  loader: ({ context }) => context.trpc.circuits.listSimple.ensureQueryData(),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: circuits = [] } = useSuspenseQuery(trpc.circuits.listSimple.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.circuits.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.circuits.listSimple.queryFilter()); toast.success("Circuit deleted"); },
    onError: () => toast.error("Failed to delete circuit"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Circuits</h1>
        <Link to="/dashboard/circuits/create"><Button>Create Circuit</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {circuits.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.type}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/circuits/$id" params={{ id: String(c.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: c.id })}>Delete</Button>
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
