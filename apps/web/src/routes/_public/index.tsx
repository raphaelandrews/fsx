import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Announcements } from "@/components/home/announcements";
import { Events } from "@/components/home/events";
import { FAQ } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { NewsFeed } from "@/components/home/news-feed";
import { Posts } from "@/components/home/posts";
import { TopPlayers } from "@/components/home/ratings/top-players";
import { DEFAULT_DESCRIPTION, SITE_NAME, buildSeo } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

// Public homepage content is admin-edited, so keep staleness short so a
// returning visitor / SPA navigation refetches quickly after an edit. This
// mirrors the short server-side cache TTL for the tRPC GET (see
// routes/api/trpc/$.ts), instead of relying on the global 5m staleTime.
const PUBLICATION_STALE_TIME = 60_000;

export const Route = createFileRoute("/_public/")({
  head: () =>
    buildSeo({
      title: `${SITE_NAME} - (FSX)`,
      description: DEFAULT_DESCRIPTION,
      path: "/",
    }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.events.list.queryOptions(undefined, { staleTime: 30_000 }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.posts.fresh.queryOptions(undefined, { staleTime: PUBLICATION_STALE_TIME }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.announcements.fresh.queryOptions(undefined, {
          staleTime: PUBLICATION_STALE_TIME,
        }),
      ),
      context.queryClient.ensureQueryData(context.trpc.topPlayers.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.records.recent.queryOptions()),
    ]);
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
  const { data: feed } = useSuspenseQuery(trpc.records.recent.queryOptions());
  // Announcements already shown in Novidades (as a title or on their own) aren't repeated below.
  const inFeed = new Set(feed.flatMap((item) => (item.announcementId === null ? [] : [item.announcementId])));
  const otherAnnouncements = announcements.filter((announcement) => !inFeed.has(announcement.id));

  return (
    <>
      <Hero posts={posts} />
      {events.length > 0 && <Events events={events} />}
      <Posts posts={posts} />
      <TopPlayers topPlayers={topPlayers} />
      {feed.length > 0 && <NewsFeed items={feed} />}
      {otherAnnouncements.length > 0 && <Announcements announcements={otherAnnouncements} />}
      <FAQ />
    </>
  );
}
