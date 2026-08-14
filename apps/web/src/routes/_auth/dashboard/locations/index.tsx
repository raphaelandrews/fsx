import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/locations/")({
  head: () => ({ meta: [{ title: "Locations - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: locations = [] } = useSuspenseQuery(trpc.locations.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.locations.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.locations.list.queryFilter());
      toast.success("Location deleted");
    },
    onError: () => toast.error("Failed to delete location"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Locations</h1>
        <Link to="/dashboard/locations/create">
          <Button>Create Location</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-4 py-2">{l.id}</td>
                <td className="px-4 py-2">{l.name}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/locations/$id" params={{ id: String(l.id) }}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: l.id })}>
                      Delete
                    </Button>
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
