import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/events/")({
  head: () => ({ title: "Events - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: events = [] } = useSuspenseQuery(trpc.events.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.events.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.events.list.queryFilter());
      toast.success("Event deleted");
    },
    onError: () => toast.error("Failed to delete event"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Events</h1>
        <Link to="/dashboard/events/create">
          <Button>Create Event</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Start Date</th>
              <th className="px-4 py-2 text-left">End Date</th>
              <th className="px-4 py-2 text-left">Time Control</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-2">{e.name}</td>
                <td className="px-4 py-2">{e.type}</td>
                <td className="px-4 py-2">{e.startDate}</td>
                <td className="px-4 py-2">{e.endDate}</td>
                <td className="px-4 py-2">{e.timeControl}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/events/$id" params={{ id: String(e.id) }}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: e.id })}>
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
