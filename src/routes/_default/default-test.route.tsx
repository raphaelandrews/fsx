import { createFileRoute } from "@tanstack/react-router";

import {
  freshAnnouncementsQueryOptions,
  freshPostsQueryOptions,
  topPlayersQueryOptions,
} from "~/db/queries";

import { AnnouncementsSection } from "~/components/home/announcements-section";
import { DataTableTabs } from "~/components/home/ratings/data-table-tabs";
import { FAQ } from "~/components/home/faq";
import { PostsSection } from "~/components/home/posts-section";
import { UpdateRegister } from "~/components/update-register";
import { useLiveQuery } from "@tanstack/react-db";
import { announcementCollection } from "~/db/collections/announcements";
import { postCollection } from "~/db/collections/posts";

export const Route = createFileRoute("/_default/default-test")({
  loader: async ({ context: { queryClient } }) => {
    const [posts, announcements, topPlayers] = await Promise.all([
      queryClient.ensureQueryData(freshPostsQueryOptions()),
      queryClient.ensureQueryData(freshAnnouncementsQueryOptions()),
      queryClient.ensureQueryData(topPlayersQueryOptions()),
    ]);
    return { posts, announcements, topPlayers };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: announcements } = useLiveQuery((query) =>
    query
      .from({ t: announcementCollection })
      .select("@t.id", "@t.year", "@t.number", "@t.content")
      .orderBy({ "@t.year": "desc", "@t.number": "desc" })
      .limit(8)
      .keyBy("@id")
  );

  const { data: posts } = useLiveQuery((query) =>
    query
      .from({ p: postCollection })
      .select(
        "@p.id",
        "@p.title",
        "@p.image",
        "@p.slug",
        "@p.published",
        "@p.createdAt"
      )
      .where("@p.published", "=", true)
      .orderBy({ "@p.createdAt": "desc" })
      .limit(6)
      .keyBy("@id")
  );

  return (
    <>
      <UpdateRegister />
      <PostsSection posts={posts} />
      <AnnouncementsSection announcements={announcements} />
      <FAQ />
    </>
  );
}
