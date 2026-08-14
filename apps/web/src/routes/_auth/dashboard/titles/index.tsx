import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/titles/")({
  head: () => ({ meta: [{ title: "Titles - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: titles = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.titles.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.titles.list.queryFilter()); toast.success("Title deleted"); },
    onError: () => toast.error("Failed to delete title"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Titles</h1>
        <Link to="/dashboard/titles/create"><Button>Create Title</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">Title</th><th className="px-4 py-2 text-left">Short</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {titles.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-2">{t.name}</td>
                <td className="px-4 py-2">{t.shortName}</td>
                <td className="px-4 py-2 text-muted-foreground">{t.type}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/titles/$id" params={{ id: String(t.id) }}><Button variant="outline" size="sm">Edit</Button></Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: t.id })}>Delete</Button>
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
