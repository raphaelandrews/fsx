import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/clubs/")({
  head: () => ({ title: "Clubs - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: clubs = [] } = useSuspenseQuery(trpc.clubs.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.clubs.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.clubs.list.queryFilter());
      toast.success("Club deleted");
    },
    onError: () => toast.error("Failed to delete club"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Clubs</h1>
        <Link to="/dashboard/clubs/create">
          <Button>Create Club</Button>
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
            {clubs.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.id}</td>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/clubs/$id" params={{ id: String(c.id) }}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: c.id })}>
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
