import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@fsx/ui/components/card";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard - FSX" },
      { name: "description", content: "Painel administrativo da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.players.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.posts.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.announcements.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.events.list.queryOptions()),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data: players = [] } = useSuspenseQuery(trpc.players.list.queryOptions());
  const { data: posts = [] } = useSuspenseQuery(trpc.posts.list.queryOptions());
  const { data: announcements = [] } = useSuspenseQuery(trpc.announcements.list.queryOptions());
  const { data: events = [] } = useSuspenseQuery(trpc.events.list.queryOptions());

  return (
    <div>
      <h1 className="mb-6 font-bold text-2xl">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{players.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{announcements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{events.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
