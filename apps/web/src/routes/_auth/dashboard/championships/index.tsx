import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

const TITLE = "Championships";
const PATH = "/_auth/dashboard/championships";
const DOMAIN = "champions";

export const Route = createFileRoute(PATH + "/")({
  head: () => ({ title: `${TITLE} - Admin - FSX` }),
  loader: ({ context }) => context.trpc.champions.list.ensureQueryData(),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: items = [] } = useSuspenseQuery(trpc[DOMAIN].list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc[DOMAIN].delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc[DOMAIN].list.queryFilter()); toast.success("Deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">{TITLE}</h1>
        <Link to={`${PATH}/create`}><Button>Create</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">ID</th><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">{item.id}</td>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to={`${PATH}/$id`} params={{ id: String(item.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: item.id })}>Delete</Button>
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
