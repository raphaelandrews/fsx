import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";
import { padNumber } from "@/utils/format";

export const Route = createFileRoute("/_auth/dashboard/announcements/")({
  head: () => ({ meta: [{ title: "Announcements - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.announcements.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: announcements = [] } = useSuspenseQuery(trpc.announcements.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.announcements.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.announcements.list.queryFilter());
      toast.success("Announcement deleted");
    },
    onError: () => toast.error("Failed to delete announcement"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Announcements</h1>
        <Link to="/dashboard/announcements/create">
          <Button>Create Announcement</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-left">Number</th>
              <th className="px-4 py-2 text-left">Content</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2">{a.year}</td>
                <td className="px-4 py-2">{padNumber(a.number)}</td>
                <td className="px-4 py-2 max-w-xs truncate">{a.content}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/announcements/$id" params={{ id: String(a.id) }}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: a.id })}>
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
