import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Announcements } from "@/components/home/announcements";
import { Events } from "@/components/home/events";
import { FAQ } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { Posts } from "@/components/home/posts";
import { TopPlayers } from "@/components/home/ratings/top-players";
import { useTRPC } from "@/utils/trpc";

// Public homepage content is admin-edited, so keep staleness short so a
// returning visitor / SPA navigation refetches quickly after an edit. This
// mirrors the short server-side cache TTL for the tRPC GET (see
// routes/api/trpc/$.ts), instead of relying on the global 5m staleTime.
const PUBLICATION_STALE_TIME = 60_000;

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Federação Sergipana de Xadrez" },
      { name: "description", content: "Site oficial da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(
      context.trpc.events.list.queryOptions(undefined, { staleTime: 30_000 }),
    );
    context.queryClient.ensureQueryData(
      context.trpc.posts.fresh.queryOptions(undefined, { staleTime: PUBLICATION_STALE_TIME }),
    );
    context.queryClient.ensureQueryData(
      context.trpc.announcements.fresh.queryOptions(undefined, { staleTime: PUBLICATION_STALE_TIME }),
    );
    context.queryClient.ensureQueryData(context.trpc.topPlayers.list.queryOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: events = [] } = useSuspenseQuery(
    trpc.events.list.queryOptions(undefined, { staleTime: 30_000 }),
  );
  const { data: posts = [] } = useSuspenseQuery(
    trpc.posts.fresh.queryOptions(undefined, { staleTime: PUBLICATION_STALE_TIME }),
  );
  const { data: announcements = [] } = useSuspenseQuery(
    trpc.announcements.fresh.queryOptions(undefined, { staleTime: PUBLICATION_STALE_TIME }),
  );
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
