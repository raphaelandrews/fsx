import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Announcements } from "@/components/home/announcements";
import { Events } from "@/components/home/events";
import { FAQ } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { Posts } from "@/components/home/posts";
import { TopPlayers } from "@/components/home/ratings/top-players";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Federação Sergipana de Xadrez" },
      { name: "description", content: "Site oficial da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(context.trpc.events.list.queryOptions());
    context.queryClient.ensureQueryData(context.trpc.posts.fresh.queryOptions());
    context.queryClient.ensureQueryData(context.trpc.announcements.fresh.queryOptions());
    context.queryClient.ensureQueryData(context.trpc.topPlayers.list.queryOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: events = [] } = useSuspenseQuery(trpc.events.list.queryOptions());
  const { data: posts = [] } = useSuspenseQuery(trpc.posts.fresh.queryOptions());
  const { data: announcements = [] } = useSuspenseQuery(trpc.announcements.fresh.queryOptions());
  const { data: topPlayers } = useSuspenseQuery(trpc.topPlayers.list.queryOptions());

  return (
    <>
      <Hero posts={posts} />
      {events.length > 0 && <Events events={events} />}
      <Posts posts={posts} />
      <TopPlayers topPlayers={topPlayers} />
      <Announcements announcements={announcements} />
      <FAQ />
    </>
  );
}
