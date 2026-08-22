import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";
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
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="tabular-nums">{a.year}</TableCell>
                <TableCell className="tabular-nums">{padNumber(a.number)}</TableCell>
                <TableCell className="max-w-xs truncate">{a.content}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/announcements/$id" params={{ id: String(a.id) }}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: a.id })}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
